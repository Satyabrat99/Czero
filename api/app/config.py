from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    exa_api_key: str = ""
    redis_url: str = "redis://localhost:6379"
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "CzeroBot/1.0"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
