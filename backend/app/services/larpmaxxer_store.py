from __future__ import annotations

import copy
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_ROOT = Path(__file__).resolve().parent.parent / "data" / "larpmaxxer"
CONTENT_ROOT = DATA_ROOT / "scenario-content"

DEFAULT_PROGRESS: dict[str, Any] = {
    "personaId": None,
    "larpRating": 50.0,
    "completedScenarios": [],
}

_MEMORY_PROGRESS: dict[str, dict[str, Any]] = {}


def _read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@lru_cache(maxsize=1)
def get_personas():
    return _read_json(DATA_ROOT / "personas.json")


@lru_cache(maxsize=1)
def get_characters():
    return _read_json(DATA_ROOT / "characters.json")


@lru_cache(maxsize=1)
def get_scenarios():
    return _read_json(DATA_ROOT / "scenarios.json")


@lru_cache(maxsize=64)
def get_scenario_content(scenario_id: str):
    content_path = CONTENT_ROOT / f"{scenario_id}.json"
    if not content_path.exists():
        return None
    return _read_json(content_path)


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


def _from_supabase_record(record: dict[str, Any]) -> dict[str, Any]:
    return normalize_progress(
        {
            "personaId": record.get("persona_id"),
            "larpRating": record.get("larp_rating"),
            "completedScenarios": record.get("completed_scenarios"),
        }
    )


def _fetch_progress_from_supabase(user_id: str, supabase) -> dict[str, Any] | None:
    try:
        result = (
            supabase.table("larpmaxxer_progress")
            .select("persona_id, larp_rating, completed_scenarios")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
    except Exception:
        return None

    if not result or not result.data:
        return None
    return _from_supabase_record(result.data)


def _persist_progress_to_supabase(user_id: str, progress: dict[str, Any], supabase) -> bool:
    payload = {
        "user_id": user_id,
        "persona_id": progress.get("personaId"),
        "larp_rating": progress.get("larpRating"),
        "completed_scenarios": progress.get("completedScenarios", []),
    }

    try:
        existing = (
            supabase.table("larpmaxxer_progress")
            .select("user_id")
            .eq("user_id", user_id)
            .execute()
        )
        if existing.data:
            (
                supabase.table("larpmaxxer_progress")
                .update({
                    "persona_id": payload["persona_id"],
                    "larp_rating": payload["larp_rating"],
                    "completed_scenarios": payload["completed_scenarios"],
                })
                .eq("user_id", user_id)
                .execute()
            )
        else:
            supabase.table("larpmaxxer_progress").insert(payload).execute()
    except Exception:
        return False

    return True


def get_progress(user_id: str, supabase) -> dict[str, Any]:
    if user_id in _MEMORY_PROGRESS:
        return copy.deepcopy(_MEMORY_PROGRESS[user_id])

    supabase_progress = _fetch_progress_from_supabase(user_id, supabase)
    if supabase_progress is not None:
        _MEMORY_PROGRESS[user_id] = copy.deepcopy(supabase_progress)
        return copy.deepcopy(supabase_progress)

    if user_id not in _MEMORY_PROGRESS:
        _MEMORY_PROGRESS[user_id] = copy.deepcopy(DEFAULT_PROGRESS)

    return copy.deepcopy(_MEMORY_PROGRESS[user_id])


def update_progress(user_id: str, updates: dict[str, Any], supabase) -> dict[str, Any]:
    current = get_progress(user_id, supabase)
    normalized_updates = normalize_progress({**current, **updates})
    _MEMORY_PROGRESS[user_id] = copy.deepcopy(normalized_updates)
    _persist_progress_to_supabase(user_id, normalized_updates, supabase)
    return copy.deepcopy(normalized_updates)
