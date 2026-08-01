# Use lightweight Python 3.11 image
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer outputs
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies (ffmpeg required by Whisper for audio processing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY backend/requirements.txt /app/backend/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy project files
COPY backend /app/backend
COPY training /app/training
COPY db /app/db

# Expose port
EXPOSE 8000

# Run FastAPI server with Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
