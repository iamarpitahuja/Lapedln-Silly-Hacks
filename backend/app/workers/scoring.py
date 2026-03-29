import logging

from app.services.gemini import evaluate_prestige
from app.services.memelord import generate_roast_meme

logger = logging.getLogger(__name__)


async def score_content(supabase, post_id: str, user_id: str, content: str):
    """
    Background task: send post content to Gemini's Prestige Evaluator,
    then update buzzword_score on the post and adjust the user's LarpRating.
    Also generates a roast meme via Meme Lord API.
    """
    try:
        result = await evaluate_prestige(content)

        # Generate a roast meme from the post content
        roast = result.get("roast", "")
        meme_prompt = f"corporate LinkedIn post roast: {roast}" if roast else f"roast this LinkedIn post: {content[:200]}"
        meme_url = await generate_roast_meme(meme_prompt)

        if supabase is not None:
            update_data = {"buzzword_score": result["buzzword_score"]}
            if meme_url:
                update_data["roast_meme_url"] = meme_url

            supabase.table("posts").update(update_data).eq("id", post_id).execute()

            supabase.rpc("update_larp_rating", {
                "target_user_id": user_id,
                "rating_delta": result["rating_delta"],
            }).execute()

        logger.info(
            "Scored post %s: buzzword=%.1f, enthusiasm=%.1f, delta=%.1f | %s | meme=%s",
            post_id,
            result["buzzword_score"],
            result["enthusiasm_score"],
            result["rating_delta"],
            result.get("roast", ""),
            meme_url or "none",
        )
    except Exception:
        logger.exception("Failed to score post %s", post_id)
