import base64
import json
import re
from collections.abc import AsyncGenerator

import websockets

from app.config import settings


def chunk_text(text: str) -> list[str]:
    """Split text on natural sentence boundaries for streaming TTS."""
    chunks = re.split(r"(?<=[.!?;])\s+", text)
    return [c.strip() for c in chunks if c.strip()]


async def stream_tts(text: str, voice_id: str) -> AsyncGenerator[bytes, None]:
    """
    Async generator that yields raw audio bytes (mp3).
    Connects to ElevenLabs WebSocket, streams text chunks in,
    yields audio chunks out. Used with FastAPI StreamingResponse.
    """
    url = (
        f"wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        f"/stream-input?model_id={settings.elevenlabs_model}"
    )

    async with websockets.connect(url) as ws:
        # 1. Send initial config with API key
        await ws.send(json.dumps({
            "text": " ",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            "xi_api_key": settings.elevenlabs_api_key,
        }))

        # 2. Send text chunks
        chunks = chunk_text(text)
        for chunk in chunks:
            await ws.send(json.dumps({
                "text": chunk + " ",
                "try_trigger_generation": True,
            }))

        # 3. Send end-of-stream signal
        await ws.send(json.dumps({"text": ""}))

        # 4. Receive and yield audio chunks
        async for message in ws:
            data = json.loads(message)
            if data.get("audio"):
                yield base64.b64decode(data["audio"])
            if data.get("isFinal"):
                break
