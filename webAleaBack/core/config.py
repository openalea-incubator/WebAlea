"""Configuration settings for the application using Pydantic BaseSettings."""
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Configuration settings for the application, loaded from environment variables (.env file).
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Ignore extra fields in the environment
    )

    # Core settings
    PROJECT_NAME: str = "FastAPI Best Practices Starter"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_REPLACE_ME"
    # manager settings
    CONDA_ENV_NAME: str = "webalea_env"
    OPENALEA_CHANNEL: str = "openalea3"
# Instantiate settings once
settings = Settings()
