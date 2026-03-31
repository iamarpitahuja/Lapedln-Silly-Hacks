import re
from collections.abc import AsyncGenerator

import httpx

from app.config import settings


def normalize_tts_text(text: str) -> str:
    """Normalize punctuation/whitespace for smoother delivery."""
    cleaned = text.replace("—", ", ").replace("–", ", ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


async def stream_tts(text: str, voice_id: str) -> AsyncGenerator[bytes, None]:
    """
    Async generator that yields raw audio bytes (mp3).
    Connects to ElevenLabs WebSocket, streams text chunks in,
    yields audio chunks out. Used with FastAPI StreamingResponse.
    """
    normalized_text = normalize_tts_text(text)
    if not normalized_text:
        return

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
    payload = {
        "text": normalized_text,
        "model_id": settings.elevenlabs_model,
        # Conservative settings to reduce synthetic/exaggerated delivery.
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.9,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "accept": "audio/mpeg",
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, headers=headers, json=payload) as response:
            if response.status_code >= 400:
                detail = await response.aread()
                raise RuntimeError(
                    f"ElevenLabs TTS failed ({response.status_code}): {detail.decode('utf-8', errors='ignore')}"
                )

            async for chunk in response.aiter_bytes():
                if chunk:
                    yield chunk
