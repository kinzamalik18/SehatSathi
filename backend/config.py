"""
SehatSaathi — Configuration
Loads all environment variables with validation.
"""

import os
from dotenv import load_dotenv

load_dotenv()


# WhatsApp Cloud API
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Safety
EMERGENCY_NUMBER = os.getenv("EMERGENCY_NUMBER", "1122")

# ML Models
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
CLASSIFIER_HEAD_PATH = os.getenv("CLASSIFIER_HEAD_PATH", "./models/classifier_head.joblib")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "intfloat/multilingual-e5-small")


def validate_config():
    """Check that critical env vars are set. Call at startup."""
    missing = []
    if not WHATSAPP_TOKEN:
        missing.append("WHATSAPP_TOKEN")
    if not WHATSAPP_PHONE_NUMBER_ID:
        missing.append("WHATSAPP_PHONE_NUMBER_ID")
    if not WHATSAPP_VERIFY_TOKEN:
        missing.append("WHATSAPP_VERIFY_TOKEN")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")

    if missing:
        print(f"WARNING: Missing environment variables: {', '.join(missing)}")
        print("Some features will not work until these are set.")
