import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.routers import larpmaxxer


class PatchLarpmaxxerProgressTests(unittest.TestCase):
    def test_patch_progress_uses_clamped_frontend_delta_once(self):
        update_progress = AsyncMock(
            return_value={
                "personaId": None,
                "larpRating": 50.0,
                "completedScenarios": [{"scenarioId": "coffee-chat", "score": 88.0, "bestScore": 88.0}],
            }
        )
        adjust_rating = AsyncMock(
            return_value={"delta": 25.0, "new_rating": 75.0, "reason": "LarpMaxxer training complete"}
        )
        db = SimpleNamespace(commit=AsyncMock())
        body = larpmaxxer.ProgressPatch(
            completedScenarios=[
                larpmaxxer.CompletedScenario(scenarioId="coffee-chat", score=88, bestScore=88),
                larpmaxxer.CompletedScenario(scenarioId="networking-event", score=91, bestScore=91),
            ],
            larpRatingDelta=42.7,
        )

        with patch.object(larpmaxxer, "update_progress", update_progress), patch.object(
            larpmaxxer, "adjust_rating", adjust_rating
        ):
            result = asyncio.run(
                larpmaxxer.patch_larpmaxxer_progress(body=body, user_id="user-1", db=db)
            )

        update_progress.assert_awaited_once()
        adjust_rating.assert_awaited_once_with(
            db,
            "user-1",
            "larpmaxxer_scenario_complete",
            {"delta": 25.0},
        )
        db.commit.assert_awaited_once()
        self.assertEqual(result["rating_change"]["delta"], 25.0)

    def test_patch_progress_falls_back_to_last_score_for_old_clients(self):
        update_progress = AsyncMock(
            return_value={
                "personaId": None,
                "larpRating": 50.0,
                "completedScenarios": [{"scenarioId": "interview", "score": 80.0, "bestScore": 80.0}],
            }
        )
        adjust_rating = AsyncMock(
            return_value={"delta": 2.7, "new_rating": 52.7, "reason": "LarpMaxxer training complete"}
        )
        db = SimpleNamespace(commit=AsyncMock())
        body = larpmaxxer.ProgressPatch(
            completedScenarios=[
                larpmaxxer.CompletedScenario(scenarioId="coffee-chat", score=60, bestScore=60),
                larpmaxxer.CompletedScenario(scenarioId="interview", score=80, bestScore=80),
            ]
        )

        with patch.object(larpmaxxer, "update_progress", update_progress), patch.object(
            larpmaxxer, "adjust_rating", adjust_rating
        ):
            result = asyncio.run(
                larpmaxxer.patch_larpmaxxer_progress(body=body, user_id="user-2", db=db)
            )

        adjust_rating.assert_awaited_once_with(
            db,
            "user-2",
            "larpmaxxer_scenario_complete",
            {"delta": 2.7},
        )
        db.commit.assert_awaited_once()
        self.assertEqual(result["rating_change"]["new_rating"], 52.7)


if __name__ == "__main__":
    unittest.main()
