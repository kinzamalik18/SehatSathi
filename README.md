# SehatSaathi — Rural Health Triage Voice Agent

> **⚠️ Important Disclaimer:** This is a decision-support prototype using fictional test cases. It is **not** a validated medical device. It makes **no diagnoses**. Any real deployment would require clinical review of the safety rules and local-language emergency keyword lists before touching real patients.

## What is SehatSaathi?

SehatSaathi is a voice-first health triage system designed for rural communities with limited access to healthcare. It helps people get quick guidance on the urgency of their symptoms through WhatsApp voice notes.

### How It Works

1. **Send a voice note** on WhatsApp describing your symptoms
2. **Automatic transcription** using OpenAI Whisper (open-source, runs locally)
3. **Safety check first** — a deterministic keyword-based emergency detector runs before anything else
4. **Urgency classification** — a trained ML classifier (not an API call) categorizes symptoms into:
   - 🔴 **Emergency** — call emergency services / go to hospital immediately
   - 🟠 **Soon** — see a doctor within a few days
   - 🟢 **Monitor** — can be watched at home for now
5. **Response with nearest clinic** — fixed templates (never AI-generated text) with clinic info and mandatory medical disclaimers

### Key Design Principles

- **Safety first**: Emergency keyword detection is deterministic (not ML-based) and cannot be disabled
- **No paid APIs in the decision path**: Whisper + trained classifier run locally
- **Fail-safe defaults**: Any classification failure defaults to emergency
- **Never diagnoses**: Every response includes a disclaimer that this is not a diagnosis
- **Low confidence = escalate**: If the classifier is unsure, urgency is pushed UP, never down

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Voice Transcription | OpenAI Whisper (open-source, local) |
| Text Embeddings | `intfloat/multilingual-e5-small` (frozen) |
| Urgency Classifier | Logistic Regression head (trained on labeled data) |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Messaging | WhatsApp Cloud API |
| Dashboard | Next.js |
| Deployment | Render/Railway (backend) + Vercel (dashboard) |

## Project Structure

```
sehatsaathi/
├── backend/          # FastAPI backend
│   ├── main.py       # Routes and app entry point
│   ├── config.py     # Environment variable loading
│   ├── db.py         # Supabase client and helpers
│   ├── whatsapp.py   # WhatsApp API integration
│   ├── transcribe.py # Whisper transcription
│   ├── classifier.py # Urgency classification
│   ├── safety.py     # Emergency keyword override
│   └── templates.py  # Fixed response templates
├── training/         # ML training pipeline
│   ├── dataset.csv   # Labeled training data
│   ├── build_dataset.py
│   └── train_classifier.py
├── dashboard/        # Next.js clinic dashboard
└── db/
    └── schema.sql    # Database schema
```

## Setup

### Prerequisites

1. Meta developer account with WhatsApp Business API access
2. Supabase project
3. Google Colab account (for one-time model training)
4. Render/Railway account (backend hosting)
5. Vercel account (dashboard hosting)

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values.

## License

MIT
