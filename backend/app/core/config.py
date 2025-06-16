from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Defines application settings, loading them from environment variables.
    The API key is now optional, allowing it to be provided via request headers.
    """
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create a single, importable instance of the settings
settings = Settings()