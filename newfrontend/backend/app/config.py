from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    # PostgreSQL (Neon)
    DATABASE_URL: str = ""

    # MongoDB — matches backend/.env variable names
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "sow_generator"
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: int = 10000
    MONGODB_CONNECT_TIMEOUT_MS: int = 10000

    # Server
    FASTAPI_PORT: int = 8001
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # Environment label shown on the dashboard env chip
    APP_ENV: Literal["PROD", "STAGING", "DEV"] = "PROD"

    # .env lives in backend/ — same dir as where uvicorn is run from
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
