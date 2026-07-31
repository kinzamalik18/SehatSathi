"""
SehatSaathi — WhatsApp Cloud API Module
Handles webhook payload parsing, media downloading (audio voice notes),
and sending text message responses back to users via Meta WhatsApp Cloud API.
"""

import httpx
from backend.config import (
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN,
)

GRAPH_API_URL = "https://graph.facebook.com/v18.0"


def verify_webhook(mode: str, token: str, challenge: str) -> str | None:
    """
    Verify the WhatsApp webhook registration request from Meta.

    Returns the challenge string if token matches, otherwise None.
    """
    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        return challenge
    return None


def parse_incoming_message(body: dict) -> dict | None:
    """
    Extract key message info from incoming Meta webhook payload.

    Returns dict with:
        - phone_number: Sender's phone number
        - message_type: 'audio' | 'text' | etc.
        - media_id: WhatsApp media ID (if audio)
        - text_body: Text message content (if text)
        - message_id: Unique message ID
    """
    try:
        entry = body.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return None

        message = messages[0]
        phone_number = message.get("from", "")
        message_type = message.get("type", "")
        message_id = message.get("id", "")

        parsed = {
            "phone_number": phone_number,
            "message_type": message_type,
            "message_id": message_id,
            "media_id": None,
            "text_body": None,
        }

        if message_type == "audio":
            parsed["media_id"] = message.get("audio", {}).get("id")
        elif message_type == "text":
            parsed["text_body"] = message.get("text", {}).get("body", "").strip()

        return parsed
    except Exception as e:
        print(f"Error parsing WhatsApp webhook payload: {e}")
        return None


async def download_media(media_id: str, destination_path: str) -> bool:
    """
    Download an audio file from WhatsApp Media API to local disk.

    Step 1: GET media URL using media_id.
    Step 2: GET media content binary and save to destination_path.
    """
    if not WHATSAPP_TOKEN:
        print("WHATSAPP_TOKEN not configured. Skipping media download.")
        return False

    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}

    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Get media URL
            media_info_url = f"{GRAPH_API_URL}/{media_id}"
            res = await client.get(media_info_url, headers=headers)
            if res.status_code != 200:
                print(f"Failed to fetch media info for ID {media_id}: {res.text}")
                return False

            media_url = res.json().get("url")
            if not media_url:
                print("No media URL found in WhatsApp response.")
                return False

            # Step 2: Download media file
            file_res = await client.get(media_url, headers=headers)
            if file_res.status_code != 200:
                print(f"Failed to download media content: {file_res.text}")
                return False

            with open(destination_path, "wb") as f:
                f.write(file_res.content)

            return True
        except Exception as e:
            print(f"Exception during WhatsApp media download: {e}")
            return False


async def send_whatsapp_message(to_phone: str, text: str) -> bool:
    """
    Send a text message back to a user via WhatsApp Cloud API.
    """
    if not WHATSAPP_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        print(f"[MOCK SEND] To: {to_phone} | Message: {text}")
        return True

    url = f"{GRAPH_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {"body": text},
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code in (200, 201):
                return True
            print(f"Failed to send WhatsApp message: {res.status_code} - {res.text}")
            return False
        except Exception as e:
            print(f"Exception sending WhatsApp message: {e}")
            return False
