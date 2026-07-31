"""
SehatSaathi — Transcription Module
Uses OpenAI Whisper (open-source, runs locally, no API key).

The model is loaded ONCE at module level as a singleton.
Never reload per-request or every message will lag from disk I/O.
"""

import whisper
from backend.config import WHISPER_MODEL_SIZE

# Load the Whisper model once at startup (singleton)
# 'base' balances accuracy and memory for free-tier servers
# 'small' gives better Urdu/Punjabi accuracy if RAM allows
_whisper_model = None


def _get_model():
    """Lazy-load the Whisper model singleton."""
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper model '{WHISPER_MODEL_SIZE}'...")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
        print("Whisper model loaded successfully.")
    return _whisper_model


def transcribe(audio_file_path: str) -> str:
    """
    Transcribe an audio file to text using Whisper.

    Args:
        audio_file_path: Path to the audio file (ogg, mp3, wav, etc.)

    Returns:
        Transcribed text string.

    Raises:
        Exception: If transcription fails for any reason.
    """
    model = _get_model()
    result = model.transcribe(audio_file_path)
    return result["text"].strip()
