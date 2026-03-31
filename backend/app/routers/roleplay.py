from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import Client

from app.config import settings
from app.dependencies import get_current_user, get_service_client
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
    supabase: Client = Depends(get_service_client),
):
    """
    Chat with a corporate LARP character. Manages conversation state
    and gets strictly formatted JSON responses from Gemini.
    """
    # Load or create session
    if body.session_id:
        session_result = (
            supabase.table("roleplay_sessions")
            .select("*")
            .eq("id", body.session_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        session = session_result.data
        history = session["conversation_history"]
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
    if body.session_id:
        supabase.table("roleplay_sessions").update({
            "conversation_history": history,
        }).eq("id", body.session_id).execute()
        session_id = body.session_id
    else:
        insert_result = supabase.table("roleplay_sessions").insert({
            "user_id": user_id,
            "character_id": body.character_id,
            "conversation_history": history,
        }).execute()
        session_id = insert_result.data[0]["id"]

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

    return StreamingResponse(
        stream_tts(text=text, voice_id=voice_id),
        media_type="audio/mpeg",
    )
