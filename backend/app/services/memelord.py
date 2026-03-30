import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.memelord.com/api/v1"


def _has_real_key():
    key = settings.memelord_api_key
    return bool(key) and not key.startswith("your-") and not key.startswith("mlord_test")


async def generate_roast_meme(prompt: str) -> str | None:
    """Call Meme Lord API to generate a meme from a text prompt. Returns the image URL or None."""
    if not _has_real_key() or not prompt:
        return None

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{_BASE_URL}/ai-meme",
                headers={
                    "Authorization": f"Bearer {settings.memelord_api_key}",
                    "Content-Type": "application/json",
                },
                json={"prompt": prompt, "count": 1},
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("Meme Lord response: %s", data)

            # Response shape: {"success": true, "results": [{"success": true, "url": "..."}]}
            if isinstance(data, dict) and data.get("success"):
                results = data.get("results", [])
                if results and results[0].get("url"):
                    return results[0]["url"]

            logger.warning("Unexpected Meme Lord response shape: %s", data)
            return None
    except Exception:
        logger.exception("Meme Lord API call failed")
        return None
