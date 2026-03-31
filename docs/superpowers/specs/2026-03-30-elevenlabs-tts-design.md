# ElevenLabs TTS for LarpMaxxer Personas

**Date:** 2026-03-30
**Status:** Approved

## Overview

Add per-character ElevenLabs TTS voices to the LarpMaxxer game. When a character speaks, a speaker button appears on their dialogue bubble. Clicking it fetches synthesized audio from the backend and plays it.

## Architecture

Three changes across the stack:

1. **`frontend/src/content/characters.ts`** — add `voiceId: string` to `CharacterProfile` type and assign an ElevenLabs voice ID to each of the 14 characters.
2. **Backend** — add `POST /api/roleplay/tts` endpoint accepting `{text, voice_id}` that returns a `StreamingResponse` (audio/mpeg) using the existing `stream_tts()` service in `app/services/elevenlabs.py`.
3. **Frontend** — add a speaker button to `DialogueBubble` for character lines. `voiceId` flows from `character.voiceId` → `DialogueScreen` → `DialogueBubble`. Clicking fetches audio, collects the stream into a blob, plays via `new Audio(blobUrl).play()`.

No changes to session state, scoring, database, or routing. TTS is purely cosmetic.

## Voice Assignments

| Character | Voice | Voice ID |
|-----------|-------|----------|
| jordan (24, earnest Associate) | Antoni | `ErXwobaYiN019PkySvjV` |
| priya (27, efficient Partnerships) | Rachel | `21m00Tcm4TlvDq8ikWAM` |
| derek (38, skeptical Senior Director) | Arnold | `VR6AewLTigWG4xSOukaG` |
| sandra (45, methodical VP Talent) | Bella | `EXAVITQu4vr4xnSDxMaL` |
| bryce (23, jargon-dense IB Analyst) | Sam | `yoZ06aMxZJJ28mfd3POQ` |
| felix (22, philosophical student) | Adam | `pNInz6obpgDQGcFmaJgB` |
| ravi (20, blunt dropout) | Josh | `TxGEqnHWrfWFTfGW9XjX` |
| oliver (40, calm Principal) | Arnold | `VR6AewLTigWG4xSOukaG` |
| zara (26, cool Creative Director) | Domi | `AZnzlk1XvdvUeBnXmlld` |
| marcus (34, GP VC) | Josh | `TxGEqnHWrfWFTfGW9XjX` |
| chad (22, territorial intern) | Sam | `yoZ06aMxZJJ28mfd3POQ` |
| vanessa (31, decisive CEO) | Elli | `MF3mGyEYCl7XYWbV9V6O` |
| marcus_pitch (34, GP variant) | Josh | `TxGEqnHWrfWFTfGW9XjX` |
| elena (36, post-exit founder) | Bella | `EXAVITQu4vr4xnSDxMaL` |

Some voices are reused across characters who appear in separate scenarios and will never play simultaneously.

## Data Flow

```
click speaker button
  → POST /api/roleplay/tts {text, voice_id}
  → backend: stream_tts() opens WebSocket to ElevenLabs
  → FastAPI StreamingResponse yields audio/mpeg chunks
  → frontend: reads full response as blob
  → URL.createObjectURL(blob) → new Audio(url).play()
  → onended: revoke blob URL, reset button to idle
```

## Button States

- **Idle**: speaker icon, clickable
- **Loading**: spinner, disabled
- **Playing**: muted icon, clicking stops playback
- **Error**: icon turns red briefly, resets to idle (silent fail — broken TTS never blocks the game)

## Error Handling

- If `ELEVENLABS_API_KEY` is empty, backend returns `503 {"detail": "TTS not configured"}`
- Button is hidden (not disabled) if character has no `voiceId`
- Only one audio instance plays at a time — clicking a new line stops the current one
- Speaker button only appears on character lines (`speaker === 'character'`), never on user responses

## Files Changed

- `frontend/src/features/larpmaxxer/types.ts` — add `voiceId?: string` to `CharacterProfile`
- `frontend/src/content/characters.ts` — add `voiceId` to all 14 characters
- `backend/app/routers/roleplay.py` — add `POST /api/roleplay/tts` endpoint
- `frontend/src/features/larpmaxxer/components/DialogueBubble.jsx` — add speaker button
- `frontend/src/features/larpmaxxer/components/DialogueScreen.jsx` — pass `voiceId` to `DialogueBubble`
