"""
SehatSaathi — FastAPI Main Application
Provides WhatsApp webhook endpoints, case triage pipeline, and dashboard API.
"""

import os
import tempfile
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import validate_config
from backend.whatsapp import (
    verify_webhook,
    parse_incoming_message,
    download_media,
    send_whatsapp_message,
)
from backend.safety import check_emergency_override
from backend.transcribe import transcribe
from backend.classifier import classify_urgency
from backend import templates
from backend import db

app = FastAPI(
    title="SehatSaathi Backend",
    description="Voice-first rural health triage AI backend",
    version="1.0.0",
)

# Enable CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    validate_config()


@app.get("/")
def read_root():
    return {"status": "online", "service": "SehatSaathi API"}


# --- WhatsApp Webhook Routes ---

@app.get("/webhook")
def whatsapp_webhook_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """WhatsApp webhook verification endpoint."""
    challenge = verify_webhook(hub_mode, hub_token, hub_challenge)
    if challenge:
        return int(challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/webhook")
async def whatsapp_webhook(request: Request):
    """
    WhatsApp webhook receiver.
    Processes voice notes and text messages through the safety & triage pipeline.
    """
    body = await request.json()
    parsed = parse_incoming_message(body)

    if not parsed:
        return {"status": "ignored"}

    phone_number = parsed["phone_number"]
    message_type = parsed["message_type"]

    # 1. Get or create conversation record
    conv = db.get_conversation_by_phone(phone_number)
    is_new_user = False
    if not conv:
        conv = db.create_conversation(phone_number)
        is_new_user = True

    conv_id = conv.get("id")

    # If first time user, send greeting first
    if is_new_user:
        await send_whatsapp_message(phone_number, templates.greeting_message())

    transcript_text = ""
    audio_url = None

    # 2. Extract transcript text
    if message_type == "audio" and parsed["media_id"]:
        # Download audio temp file
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            download_success = await download_media(parsed["media_id"], tmp_path)
            if download_success:
                transcript_text = transcribe(tmp_path)
            else:
                transcript_text = "Audio recording could not be downloaded."
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    elif message_type == "text" and parsed["text_body"]:
        transcript_text = parsed["text_body"]
    else:
        # Unsupported message type
        return {"status": "unsupported_message_type"}

    if not transcript_text:
        await send_whatsapp_message(
            phone_number,
            "Could not process your voice note. Please try recording again clearly.",
        )
        return {"status": "empty_transcript"}

    # 3. SAFETY OVERRIDE CHECK — Runs BEFORE any ML model
    is_emergency = check_emergency_override(transcript_text)

    # Find nearest clinic info for template
    clinic = db.get_nearest_clinic() or {
        "name": "nearest hospital",
        "address": "",
        "open_hours": "24 hours",
    }

    if is_emergency:
        urgency_level = "emergency"
        confidence = 1.0
        triggered_by = "keyword_override"
        reply_text = templates.emergency_message(
            clinic_name=clinic.get("name", "nearest hospital"),
            clinic_address=clinic.get("address", ""),
        )
    else:
        # 4. ML CLASSIFIER — Run urgency classification
        clf_result = classify_urgency(transcript_text)
        urgency_level = clf_result["urgency_level"]
        confidence = clf_result["confidence"]
        triggered_by = "model"

        if urgency_level == "emergency":
            reply_text = templates.emergency_message(
                clinic_name=clinic.get("name", "nearest hospital"),
                clinic_address=clinic.get("address", ""),
            )
        elif urgency_level == "soon":
            reply_text = templates.soon_message(
                transcript_summary=transcript_text,
                clinic_name=clinic.get("name", "nearest clinic"),
                open_hours=clinic.get("open_hours", "8am-5pm"),
            )
        else:  # monitor
            advice = templates.get_advice_for_symptoms(transcript_text)
            reply_text = templates.monitor_message(
                transcript_summary=transcript_text,
                advice_text=advice,
            )

    # 5. Store triage case in database
    db.create_triage_case(
        conversation_id=conv_id,
        transcript_text=transcript_text,
        symptoms_summary=transcript_text,
        urgency_level=urgency_level,
        confidence=confidence,
        triggered_by=triggered_by,
        audio_url=audio_url,
    )

    # 6. Send template reply back to user
    await send_whatsapp_message(phone_number, reply_text)

    return {
        "status": "processed",
        "urgency_level": urgency_level,
        "triggered_by": triggered_by,
    }


# --- Dashboard API Routes ---

class StatusUpdateRequest(BaseModel):
    status: str  # open | contacted | resolved


@app.get("/cases")
def list_triage_cases(status: str = Query(None)):
    """List all triage cases sorted by urgency (emergency > soon > monitor)."""
    try:
        cases = db.get_triage_cases(status=status)
        return {"cases": cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/cases/{case_id}")
def get_triage_case_detail(case_id: str):
    """Get full details for a single triage case."""
    case = db.get_triage_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@app.post("/cases/{case_id}/status")
def update_case_status(case_id: str, payload: StatusUpdateRequest):
    """Update case status (open -> contacted -> resolved)."""
    if payload.status not in ["open", "contacted", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    updated = db.update_triage_case_status(case_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Case not found or update failed")
    return updated


@app.get("/clinics")
def list_clinics():
    """List all registered clinics."""
    try:
        clinics = db.get_clinics()
        return {"clinics": clinics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
