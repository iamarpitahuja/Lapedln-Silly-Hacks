from pathlib import Path
from pydantic_settings import BaseSettings

_ROOT = Path(__file__).parent.parent.parent  # project root


class Settings(BaseSettings):
    # DEV_MODE=false means Supabase is live. Auth is still skipped (no login UI yet).
    # Gemini is auto-mocked when gemini_api_key is empty.
    dev_mode: bool = False

    supabase_url: str = "http://127.0.0.1:54321"
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""

    # Defaults
    gemini_model: str = "gemini-2.0-flash"
    elevenlabs_model: str = "eleven_turbo_v2_5"

    @property
    def skip_auth(self) -> bool:
        """Skip JWT verification (no login UI yet). Always true until auth is built."""
        return True

    model_config = {"env_file": str(_ROOT / ".env"), "env_file_encoding": "utf-8"}


settings = Settings()
