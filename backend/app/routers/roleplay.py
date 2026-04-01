from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import RoleplaySession
from app.services.elevenlabs import stream_tts
from app.services.gemini import roleplay_chat
from app.services.voice_registry import get_character_prompt, list_characters

router = APIRouter(tags=["roleplay"])


class ChatMessage(BaseModel):
    session_id: str | None = None
    character_id: str
    message: str


class TTSRequest(BaseModel):
    text: str
    voice_id: str


@router.get("/roleplay/characters")
async def get_characters():
    """List available roleplay characters."""
    return {"characters": list_characters()}


@router.post("/roleplay/chat")
async def chat(
    body: ChatMessage,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Chat with a corporate LARP character. Manages conversation state
    and gets strictly formatted JSON responses from Gemini.
    """
    # Load or create session
    session = None
    if body.session_id:
        session = await db.get(RoleplaySession, body.session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Session not found")
        history = session.conversation_history or []
    else:
        history = []

    # Append user message
    history.append({"role": "user", "text": body.message})

    # Get character response from Gemini
    character_prompt = get_character_prompt(body.character_id)
    response = await roleplay_chat(character_prompt, history)

    # Append character response to history
    history.append({"role": "model", "text": response["dialogue"]})

    # Save session
    if body.session_id and session:
        session.conversation_history = history
        await db.commit()
        session_id = session.id
    else:
        new_session = RoleplaySession(
            user_id=user_id,
            character_id=body.character_id,
            conversation_history=history,
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        session_id = new_session.id

    return {
        "session_id": session_id,
        "character_id": response.get("character_id", body.character_id),
        "dialogue": response["dialogue"],
        "emotion": response.get("emotion", "inspired"),
    }


@router.post("/roleplay/tts")
async def synthesize_roleplay_tts(
    body: TTSRequest,
):
    text = body.text.strip()
    voice_id = body.voice_id.strip()

    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="TTS not configured")

    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    if not voice_id:
        raise HTTPException(status_code=400, detail="voice_id is required")

    try:
        chunks = []
        async for chunk in stream_tts(text=text, voice_id=voice_id):
            chunks.append(chunk)
        audio_bytes = b"".join(chunks)
    except RuntimeError as exc:
        msg = str(exc)
        if "401" in msg or "unusual_activity" in msg:
            raise HTTPException(status_code=503, detail="Voice service temporarily unavailable")
        raise HTTPException(status_code=502, detail="Voice synthesis failed")

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Length": str(len(audio_bytes))},
    )
