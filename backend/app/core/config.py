from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"

    # Anthropic (Claude)
    ANTHROPIC_API_KEY: str

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_PRICE_ID: str

    # Gmail OAuth
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REFRESH_TOKEN: str = ""

    # SMTP Fallback
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # App
    ENVIRONMENT: str = "development"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
