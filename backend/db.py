"""
SehatSaathi — Database Module
Supabase client initialization and CRUD helpers for
conversations, triage_cases, and clinics.
"""

from supabase import create_client, Client
from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


# Initialize Supabase client (singleton)
_supabase_client: Client = None


def get_client() -> Client:
    """Get or create the Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
            )
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


# --- Conversations ---

def create_conversation(phone_number: str, language: str = "ur") -> dict:
    """Create a new conversation record."""
    client = get_client()
    result = client.table("conversations").insert({
        "phone_number": phone_number,
        "language": language,
    }).execute()
    return result.data[0] if result.data else {}


def get_conversation_by_phone(phone_number: str) -> dict | None:
    """Find the most recent conversation for a phone number."""
    client = get_client()
    result = (
        client.table("conversations")
        .select("*")
        .eq("phone_number", phone_number)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


# --- Triage Cases ---

def create_triage_case(
    conversation_id: str,
    transcript_text: str,
    symptoms_summary: str,
    urgency_level: str,
    confidence: float,
    triggered_by: str,
    audio_url: str = None,
) -> dict:
    """Insert a new triage case."""
    client = get_client()
    row = {
        "conversation_id": conversation_id,
        "transcript_text": transcript_text,
        "symptoms_summary": symptoms_summary,
        "urgency_level": urgency_level,
        "confidence": confidence,
        "triggered_by": triggered_by,
        "status": "open",
    }
    if audio_url:
        row["audio_url"] = audio_url

    result = client.table("triage_cases").insert(row).execute()
    return result.data[0] if result.data else {}


def get_triage_cases(status: str = None) -> list:
    """
    List triage cases, sorted: emergency > soon > monitor, most recent first.
    Optionally filter by status.
    """
    client = get_client()
    query = client.table("triage_cases").select(
        "*, conversations(phone_number, language)"
    )

    if status:
        query = query.eq("status", status)

    result = query.order("created_at", desc=True).execute()

    if not result.data:
        return []

    # Sort by urgency priority: emergency first, then soon, then monitor
    urgency_order = {"emergency": 0, "soon": 1, "monitor": 2}
    sorted_cases = sorted(
        result.data,
        key=lambda c: (urgency_order.get(c.get("urgency_level", "monitor"), 3)),
    )
    return sorted_cases


def get_triage_case_by_id(case_id: str) -> dict | None:
    """Get a single triage case by ID with full details."""
    client = get_client()
    result = (
        client.table("triage_cases")
        .select("*, conversations(phone_number, language)")
        .eq("id", case_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def update_triage_case_status(case_id: str, status: str) -> dict:
    """Update the status of a triage case (open -> contacted -> resolved)."""
    client = get_client()
    result = (
        client.table("triage_cases")
        .update({"status": status})
        .eq("id", case_id)
        .execute()
    )
    return result.data[0] if result.data else {}


# --- Clinics ---

def get_clinics() -> list:
    """List all clinics."""
    client = get_client()
    result = client.table("clinics").select("*").execute()
    return result.data if result.data else []


def get_nearest_clinic() -> dict | None:
    """
    Get the nearest/best clinic for the demo version.
    In production, this would use lat/lng distance calculation.
    For now, returns the first clinic in the table.
    """
    client = get_client()
    result = client.table("clinics").select("*").limit(1).execute()
    return result.data[0] if result.data else None
