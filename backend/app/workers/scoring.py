import logging

from sqlalchemy import select, func

from app.database import async_session
from app.models import Post
from app.services.gemini import evaluate_prestige
from app.services.memelord import generate_roast_meme
from app.services.rating_engine import adjust_rating

logger = logging.getLogger(__name__)

FIRST_POST_BONUS = 10.0


async def score_content(post_id: str, user_id: str, content: str):
    """
    Background task: send post content to Gemini's Prestige Evaluator,
    then update buzzword_score on the post and adjust the user's LarpRating.
    Also generates a roast meme via Meme Lord API.

    Creates its own DB session since background tasks run after the request completes.
    """
    try:
        result = await evaluate_prestige(content)

        # Generate a roast meme from the post content
        roast = result.get("roast", "")
        meme_prompt = f"corporate LinkedIn post roast: {roast}" if roast else f"roast this LinkedIn post: {content[:200]}"
        meme_url = await generate_roast_meme(meme_prompt)

        async with async_session() as db:
            # Update post scores
            post = await db.get(Post, post_id)
            if post:
                post.buzzword_score = result["buzzword_score"]
                if meme_url:
                    post.roast_meme_url = meme_url

            # Check if this is the user's first post — give a welcome bonus
            post_count = await db.execute(
                select(func.count()).select_from(Post).where(Post.author_id == user_id)
            )
            is_first_post = post_count.scalar() == 1

            delta = result["rating_delta"]
            if is_first_post:
                delta = max(delta, 0) + FIRST_POST_BONUS
                logger.info("First post bonus for user %s: +%.1f", user_id[:8], FIRST_POST_BONUS)

            # Update larp rating via centralized engine
            await adjust_rating(
                db, user_id, "prestige_evaluated",
                {"delta": delta},
            )

            await db.commit()

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
