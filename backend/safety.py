"""
SehatSaathi — Safety Layer
Deterministic keyword-based emergency override.

THIS IS THE MOST IMPORTANT FILE IN THE PROJECT.
This runs BEFORE any ML model, every single time.
It is a hardcoded keyword check, not an LLM call,
because emergency detection cannot depend on model reliability.

If check_emergency_override() returns True:
  - Skip classification entirely
  - Send the fixed emergency template
  - Log with triggered_by='keyword_override'
  - This override CANNOT be disabled by any setting.
"""

# Emergency keywords — English baseline
# IMPORTANT: For real deployment, Urdu/Punjabi equivalents MUST be added.
# This English-only list is a placeholder. Do not ship without local-language terms.
EMERGENCY_KEYWORDS = [
    # Chest / breathing
    "chest pain",
    "cant breathe",
    "can't breathe",
    "cannot breathe",
    "shortness of breath",
    "difficulty breathing",
    "breathing problem",
    "hard to breathe",

    # Bleeding / trauma
    "heavy bleeding",
    "severe bleeding",
    "won't stop bleeding",
    "blood everywhere",
    "accident",
    "unconscious",
    "not conscious",
    "passed out",
    "fainted",

    # Stroke signs
    "face drooping",
    "can't speak",
    "cannot speak",
    "one side numb",
    "seizure",
    "convulsion",
    "fitting",

    # Obstetric emergency
    "labor pain",
    "labour pain",
    "bleeding pregnant",
    "pregnant bleeding",
    "water broke",

    # Poisoning / overdose
    "poison",
    "overdose",
    "swallowed chemicals",

    # Severe pain indicators
    "unbearable pain",
    "worst pain",

    # Burns
    "severe burn",
    "badly burned",

    # Cardiac
    "heart attack",
    "heart stopped",
    "no pulse",
]


def check_emergency_override(transcript_text: str) -> bool:
    """
    Check if the transcript contains any emergency keywords.

    Returns True if an emergency keyword is found.
    When True, the caller MUST skip ML classification and
    send the emergency template immediately.

    This function is intentionally simple and deterministic.
    """
    text = transcript_text.lower()
    return any(keyword in text for keyword in EMERGENCY_KEYWORDS)
