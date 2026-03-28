import logging

from app.services.gemini import evaluate_prestige

logger = logging.getLogger(__name__)


async def score_content(supabase, post_id: str, user_id: str, content: str):
    """
    Background task: send post content to Gemini's Prestige Evaluator,
    then update buzzword_score on the post and adjust the user's LarpRating.
    """
    try:
        result = await evaluate_prestige(content)

        if supabase is not None:
            supabase.table("posts").update({
                "buzzword_score": result["buzzword_score"],
            }).eq("id", post_id).execute()

            supabase.rpc("update_larp_rating", {
                "target_user_id": user_id,
                "rating_delta": result["rating_delta"],
            }).execute()

        logger.info(
            "Scored post %s: buzzword=%.1f, enthusiasm=%.1f, delta=%.1f | %s",
            post_id,
            result["buzzword_score"],
            result["enthusiasm_score"],
            result["rating_delta"],
            result.get("roast", ""),
        )
    except Exception:
        logger.exception("Failed to score post %s", post_id)
