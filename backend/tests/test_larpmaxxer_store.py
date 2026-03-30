from app.services.larpmaxxer_store import (
    get_progress,
    get_scenario_content,
    normalize_progress,
    update_progress,
)


class BrokenSupabase:
    def table(self, _table_name):
        raise RuntimeError("table missing in test")


def test_normalize_progress_coerces_shape():
    raw = {
        "persona_id": "ai_founder",
        "larp_rating": "61.27",
        "completed_scenarios": [
            {"scenario_id": "coffee-chat", "score": "58", "best_score": "62"},
            {"scenarioId": "networking-event", "score": "not-a-number", "bestScore": 44},
        ],
    }

    normalized = normalize_progress(raw)

    assert normalized["personaId"] == "ai_founder"
    assert normalized["larpRating"] == 61.3
    assert normalized["completedScenarios"][0]["bestScore"] == 62.0
    assert normalized["completedScenarios"][1]["score"] == 0.0


def test_progress_falls_back_to_memory_when_supabase_unavailable():
    supabase = BrokenSupabase()
    user_id = "user-memory"

    baseline = get_progress(user_id, supabase)
    assert baseline["larpRating"] == 50.0

    updated = update_progress(
        user_id,
        {"personaId": "consulting_clone", "larpRating": 53.2},
        supabase,
    )

    assert updated["personaId"] == "consulting_clone"
    assert updated["larpRating"] == 53.2
    assert get_progress(user_id, supabase)["personaId"] == "consulting_clone"


def test_scenario_content_loaded_from_generated_bundle():
    content = get_scenario_content("coffee-chat")

    assert content is not None
    assert content["scenarioId"] == "coffee-chat"
    assert len(content["dialogueNodes"]) > 0
