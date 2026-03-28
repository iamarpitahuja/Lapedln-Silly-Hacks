from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    gemini_api_key: str
    elevenlabs_api_key: str

    # Defaults
    gemini_model: str = "gemini-2.0-flash"
    elevenlabs_model: str = "eleven_turbo_v2_5"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
