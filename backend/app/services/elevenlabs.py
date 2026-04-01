import asyncio
import random
import re
import time
from collections.abc import AsyncGenerator

import httpx

from app.config import settings

# --- Request throttling ---
# Track the last request timestamp to enforce a minimum gap between calls,
# preventing burst patterns that trigger ElevenLabs abuse detection.
_last_request_time: float = 0.0
_throttle_lock = asyncio.Lock()
_MIN_DELAY = 0.5  # seconds between requests

# --- User-Agent rotation ---
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]


def normalize_tts_text(text: str) -> str:
    """Normalize punctuation/whitespace for smoother delivery."""
    cleaned = text.replace("—", ", ").replace("–", ", ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


async def _throttle() -> None:
    """Enforce minimum delay between ElevenLabs requests."""
    global _last_request_time
    async with _throttle_lock:
        now = time.monotonic()
        elapsed = now - _last_request_time
        if elapsed < _MIN_DELAY:
            await asyncio.sleep(_MIN_DELAY - elapsed)
        _last_request_time = time.monotonic()


async def stream_tts(text: str, voice_id: str) -> AsyncGenerator[bytes, None]:
    """
    Async generator that yields raw audio bytes (mp3).
    Connects to ElevenLabs streaming endpoint, yields audio chunks out.
    Includes request throttling and user-agent rotation to avoid
    triggering abuse detection on cloud-hosted environments.
    """
    normalized_text = normalize_tts_text(text)
    if not normalized_text:
        return

    await _throttle()

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
        "user-agent": random.choice(_USER_AGENTS),
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
