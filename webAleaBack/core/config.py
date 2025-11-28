"""Configuration settings for the application using Pydantic BaseSettings."""
import logging
from pathlib import Path
from typing import Optional
from logging.config import dictConfig
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
    # logging settings (configurable via environment variables)
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_DATEFORMAT: str = "%Y-%m-%d %H:%M:%S"
    LOG_FILE: Optional[str] = "logs/app.log"  # path to a log file; empty -> no file logging
    LOG_TO_CONSOLE: bool = True
# Instantiate settings once
settings = Settings()

"""
Configure Python logging
This sets up a console handler by default and an optional file
handler when `LOG_FILE` is provided.
"""

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": settings.LOG_FORMAT,
            "datefmt": settings.LOG_DATEFORMAT,
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": settings.LOG_LEVEL,
            "stream": "ext://sys.stdout",
        }
    },
    "root": {
        "level": settings.LOG_LEVEL,
        "handlers": ["console"] if settings.LOG_TO_CONSOLE else [],
    },
}

if settings.LOG_FILE:
    # Ensure parent dir exists
    try:
        Path(settings.LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        # If directory creation fails, fall back to console-only logging
        logging.warning("Could not create log directory for %s: %s", settings.LOG_FILE, e)

    LOGGING_CONFIG["handlers"]["file"] = {
        "class": "logging.FileHandler",
        "formatter": "default",
        "level": settings.LOG_LEVEL,
        "filename": settings.LOG_FILE,
        "encoding": "utf-8",
    }

    # ensure file handler is attached to root
    if "file" not in LOGGING_CONFIG["root"]["handlers"]:
        LOGGING_CONFIG["root"]["handlers"].append("file")

# Apply logging configuration
dictConfig(LOGGING_CONFIG)
