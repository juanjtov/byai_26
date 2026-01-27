from pydantic_settings import BaseSettings
from pydantic import Field, AliasChoices
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Supabase
    supabase_url: str
    supabase_publishable_key: str = Field(
        validation_alias=AliasChoices('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY')
    )
    supabase_secret_key: str = Field(
        validation_alias=AliasChoices('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
    )

    # OpenAI (for embeddings)
    openai_api_key: str

    # OpenRouter (for chat completions)
    openrouter_api_key: str = ""
    openrouter_default_model: str = "openai/gpt-4o-mini"
    openrouter_embedding_model: str = "openai/text-embedding-3-small"

    # Application
    app_env: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Note: JWT_SECRET removed - using JWKS for token verification

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
