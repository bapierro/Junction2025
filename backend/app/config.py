from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # Load env vars from the repo root `.env` and use the
    # STORYCIRCLE_* prefix documented in backend/README.md.
    model_config = SettingsConfigDict(
        env_prefix="STORYCIRCLE_",
        env_file=ROOT_DIR / ".env",
        extra="ignore",
    )

    database_url: str = "sqlite:///./storycircle.db"
    storage_dir: Path = Path("storage/audio")
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    elevenlabs_agent_id: str = "agent_5601ka2ded7yfj4b3dv8v5k32srr"
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    openai_reasoning_effort: str = "low"
    admin_token: str = ""  # simple hackathon auth
    share_token_secret: str = "change-me"
    base_url: str = "http://localhost:8000"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    return settings
