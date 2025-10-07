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

# Instantiate settings once
settings = Settings()
