from __future__ import annotations

import copy
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import LarpmaxxerProgress

DATA_ROOT = Path(__file__).resolve().parent.parent / "data" / "larpmaxxer"
CONTENT_ROOT = DATA_ROOT / "scenario-content"

DEFAULT_PROGRESS: dict[str, Any] = {
    "personaId": None,
    "larpRating": 50.0,
    "completedScenarios": [],
}

_MEMORY_PROGRESS: dict[str, dict[str, Any]] = {}

LARPMAXXER_VOICE_IDS: dict[str, str] = {
    "jordan": "CwhRBWXzGAHq8TQ4Fs17",
    "priya": "cgSgspJ2msm6clMCkdW9",
    "derek": "iP95p4xoKVk53GoZ742B",
    "sandra": "SAz9YHcvj6GT2YYXdXww",
    "bryce": "N2lVS1w4EtoT3dr4eOWO",
    "felix": "pqHfZKP75CvOlQylNhV4",
    "ravi": "pNInz6obpgDQGcFmaJgB",
    "oliver": "bIHbv24MWmeRgasZH58o",
    "zara": "FGY2WhTYpPnrIDTdsKH5",
    "marcus": "JBFqnCBsd6RMkjVDRZzb",
    "chad": "TX3LPaxmHKxFdv7VOQHJ",
    "vanessa": "EXAVITQu4vr4xnSDxMaL",
    "marcus_pitch": "IKne3meq5aSn9XLyUdCD",
    "elena": "Xb7hH8MSUJpSbSDYk0k2",
}


def _read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache(maxsize=1)
def get_personas():
    return _read_json(DATA_ROOT / "personas.json")


@lru_cache(maxsize=1)
def get_characters():
    characters = _read_json(DATA_ROOT / "characters.json")
    if not isinstance(characters, list):
        return characters

    enriched: list[dict[str, Any]] = []
    for raw in characters:
        if not isinstance(raw, dict):
            continue
        character = dict(raw)
        character_id = character.get("id")
        if character_id in LARPMAXXER_VOICE_IDS:
            character["voiceId"] = LARPMAXXER_VOICE_IDS[character_id]
        enriched.append(character)
    return enriched


@lru_cache(maxsize=1)
def get_scenarios():
    return _read_json(DATA_ROOT / "scenarios.json")


@lru_cache(maxsize=64)
def get_scenario_content(scenario_id: str):
    content_path = CONTENT_ROOT / f"{scenario_id}.json"
    if not content_path.exists():
        return None
    return _read_json(content_path)


def get_character_voice_id(character_id: str) -> str | None:
    return LARPMAXXER_VOICE_IDS.get(character_id)


def _normalize_completed_scenarios(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []

    normalized: list[dict[str, Any]] = []
    for row in value:
        if not isinstance(row, dict):
            continue
        scenario_id = row.get("scenarioId") or row.get("scenario_id")
        if not scenario_id:
            continue
        score = row.get("score", 0)
        best_score = row.get("bestScore", row.get("best_score", score))
        try:
            score_num = float(score)
        except (TypeError, ValueError):
            score_num = 0.0
        try:
            best_score_num = float(best_score)
        except (TypeError, ValueError):
            best_score_num = score_num
        normalized.append(
            {
                "scenarioId": str(scenario_id),
                "score": score_num,
                "bestScore": max(score_num, best_score_num),
            }
        )
    return normalized


def normalize_progress(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return copy.deepcopy(DEFAULT_PROGRESS)

    persona_id = value.get("personaId", value.get("persona_id"))
    larp_rating_raw = value.get("larpRating", value.get("larp_rating", DEFAULT_PROGRESS["larpRating"]))
    try:
        larp_rating = float(larp_rating_raw)
    except (TypeError, ValueError):
        larp_rating = float(DEFAULT_PROGRESS["larpRating"])

    return {
        "personaId": str(persona_id) if persona_id else None,
        "larpRating": max(1.0, round(larp_rating, 1)),
        "completedScenarios": _normalize_completed_scenarios(
            value.get("completedScenarios", value.get("completed_scenarios", []))
        ),
    }


def _from_db_record(record: LarpmaxxerProgress) -> dict[str, Any]:
    return normalize_progress(
        {
            "personaId": record.persona_id,
            "larpRating": record.larp_rating,
            "completedScenarios": record.completed_scenarios,
        }
    )


async def _fetch_progress_from_db(user_id: str, db: AsyncSession) -> dict[str, Any] | None:
    try:
        result = await db.execute(
            select(LarpmaxxerProgress).where(LarpmaxxerProgress.user_id == user_id)
        )
        record = result.scalar_one_or_none()
        if not record:
            return None
        return _from_db_record(record)
    except Exception:
        return None


async def _persist_progress_to_db(user_id: str, progress: dict[str, Any], db: AsyncSession) -> bool:
    try:
        existing = await db.get(LarpmaxxerProgress, user_id)
        if existing:
            existing.persona_id = progress.get("personaId")
            existing.larp_rating = progress.get("larpRating")
            existing.completed_scenarios = progress.get("completedScenarios", [])
        else:
            record = LarpmaxxerProgress(
                user_id=user_id,
                persona_id=progress.get("personaId"),
                larp_rating=progress.get("larpRating"),
                completed_scenarios=progress.get("completedScenarios", []),
            )
            db.add(record)
        await db.commit()
        return True
    except Exception:
        return False


async def get_progress(user_id: str, db: AsyncSession) -> dict[str, Any]:
    if user_id in _MEMORY_PROGRESS:
        return copy.deepcopy(_MEMORY_PROGRESS[user_id])

    db_progress = await _fetch_progress_from_db(user_id, db)
    if db_progress is not None:
        _MEMORY_PROGRESS[user_id] = copy.deepcopy(db_progress)
        return copy.deepcopy(db_progress)

    if user_id not in _MEMORY_PROGRESS:
        _MEMORY_PROGRESS[user_id] = copy.deepcopy(DEFAULT_PROGRESS)

    return copy.deepcopy(_MEMORY_PROGRESS[user_id])


async def update_progress(user_id: str, updates: dict[str, Any], db: AsyncSession) -> dict[str, Any]:
    current = await get_progress(user_id, db)
    normalized_updates = normalize_progress({**current, **updates})
    _MEMORY_PROGRESS[user_id] = copy.deepcopy(normalized_updates)
    await _persist_progress_to_db(user_id, normalized_updates, db)
    return copy.deepcopy(normalized_updates)
