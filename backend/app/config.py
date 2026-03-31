from pathlib import Path
from pydantic_settings import BaseSettings

_ROOT = Path(__file__).parent.parent.parent  # project root


class Settings(BaseSettings):
    dev_mode: bool = False

    # JWT auth
    jwt_secret: str = "change-me-in-production"

    # AI services
    gemini_api_key: str = ""
    elevenlabs_api_key: str = ""
    memelord_api_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"

    # Model defaults
    gemini_model: str = "gemini-2.0-flash"
    elevenlabs_model: str = "eleven_v3"

    # File uploads
    upload_dir: str = str(_ROOT / "backend" / "uploads")

    @property
    def skip_auth(self) -> bool:
        return self.dev_mode

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = {"env_file": str(_ROOT / ".env"), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
