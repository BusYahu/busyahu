import os
from pydantic_settings import BaseSettings

def _get_int(key: str, default: int) -> int:
    val = os.getenv(key)
    if val is not None and val.strip().isdigit():
        try:
            return int(val.strip())
        except Exception:
            return default
    return default

class Settings(BaseSettings):
    PROJECT_NAME: str = "BusYahu API (FastAPI)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Configuracion de MongoDB
    MONGO_URI: str = os.getenv(
        "MONGO_URI", 
        "mongodb://admin:secretpassword@mongo:27017/railworld_db?authSource=admin"
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", os.getenv("MONGO_INITDB_DATABASE", "railworld_db"))
    
    # Configuracion de Seguridad JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_railworld_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7)  # 7 dias
    
    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

    # Configuracion de Servidor de Correo (SMTP / Gmail / Outlook)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = _get_int("SMTP_PORT", 587)
    SMTP_USER: str = os.getenv("SMTP_USER", os.getenv("EMAIL_USER", ""))
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", os.getenv("EMAIL_APP_PASSWORD", ""))
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "BusYahu Rail")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()

