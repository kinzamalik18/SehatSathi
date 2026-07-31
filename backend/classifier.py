"""
SehatSaathi — Urgency Classifier Module
Uses frozen multilingual sentence embeddings + a trained classification head.

Components loaded at startup (singletons):
  1. SentenceTransformer embedder (intfloat/multilingual-e5-small, frozen, no training)
  2. Trained LogisticRegression head (classifier_head.joblib, trained in Colab)

Classification levels: emergency | soon | monitor

FAIL-SAFE RULE: On ANY exception (missing model, embedding failure, etc.),
default to emergency with confidence 0.0. A missed emergency is far worse
than a false alarm.

CONFIDENCE RULE: Below 0.7 confidence, push urgency UP one level.
  - monitor with low confidence -> soon
  - soon with low confidence -> emergency
  - Never round down.
"""

import os
import joblib
from sentence_transformers import SentenceTransformer
from backend.config import CLASSIFIER_HEAD_PATH, EMBEDDING_MODEL_NAME

# Singletons — loaded once at startup
_embedder = None
_classifier = None


def _get_embedder():
    """Lazy-load the sentence embedding model."""
    global _embedder
    if _embedder is None:
        print(f"Loading embedding model '{EMBEDDING_MODEL_NAME}'...")
        _embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
        print("Embedding model loaded successfully.")
    return _embedder


def _get_classifier():
    """Lazy-load the trained classifier head."""
    global _classifier
    if _classifier is None:
        if not os.path.exists(CLASSIFIER_HEAD_PATH):
            raise FileNotFoundError(
                f"Classifier head not found at '{CLASSIFIER_HEAD_PATH}'. "
                f"Run training/train_classifier.py first and place the output in backend/models/"
            )
        print(f"Loading classifier head from '{CLASSIFIER_HEAD_PATH}'...")
        _classifier = joblib.load(CLASSIFIER_HEAD_PATH)
        print("Classifier head loaded successfully.")
    return _classifier


def classify_urgency(transcript_text: str) -> dict:
    """
    Classify the urgency level of a symptom transcript.

    Args:
        transcript_text: The transcribed symptom text.

    Returns:
        dict with keys:
            - urgency_level: 'emergency' | 'soon' | 'monitor'
            - confidence: float between 0 and 1
            - transcript_summary: the input text (used in response templates)

    On any failure, returns emergency with confidence 0.0 (fail-safe).
    """
    try:
        embedder = _get_embedder()
        clf = _get_classifier()

        # Generate embedding
        embedding = embedder.encode([transcript_text])

        # Get prediction probabilities
        probs = clf.predict_proba(embedding)[0]
        classes = clf.classes_
        top_idx = probs.argmax()
        urgency_level = classes[top_idx]
        confidence = float(probs[top_idx])

        # Confidence threshold: below 0.7, push up one level
        # Never round down — a false alarm is better than a missed emergency
        if confidence < 0.7 and urgency_level == "monitor":
            urgency_level = "soon"
        elif confidence < 0.7 and urgency_level == "soon":
            urgency_level = "emergency"

        return {
            "urgency_level": urgency_level,
            "confidence": confidence,
            "transcript_summary": transcript_text,
        }

    except Exception as e:
        # FAIL-SAFE: Any error -> default to emergency
        print(f"Classification failed: {e}. Defaulting to emergency (fail-safe).")
        return {
            "urgency_level": "emergency",
            "confidence": 0.0,
            "transcript_summary": "Classification failed, defaulting to safe path",
        }
