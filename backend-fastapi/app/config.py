import os
from pydantic_settings import BaseSettings

try:
    from app.secrets import get_smtp_credentials as _get_smtp_creds
    _FALLBACK_SMTP_USER, _FALLBACK_SMTP_PASSWORD = _get_smtp_creds()
except Exception:
    _FALLBACK_SMTP_USER, _FALLBACK_SMTP_PASSWORD = "", ""

try:
    from app.secrets import get_wallet_api_key as _get_wallet_key
    _FALLBACK_WALLET_API_KEY = _get_wallet_key()
except Exception:
    _FALLBACK_WALLET_API_KEY = ""

def _get_int(key: str, default: int) -> int:
    val = os.getenv(key)
    if val is not None and val.strip().isdigit():
        try:
            return int(val.strip())
        except Exception:
            return default
    return default

def _build_mongo_uri() -> str:
    uri = os.getenv("MONGO_URI", "").strip()

    # Dentro de Docker Compose la URI debe conservar el host interno "mongo".
    # Si se reescribe a localhost, el contenedor falla con ENOTFOUND/ECONNREFUSED.
    if uri:
        return uri

    # Fallback exclusivo para ejecución local (fuera de Docker).
    return "mongodb://localhost:27017/busyahu_db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "BusYahu API (FastAPI)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Configuracion de MongoDB
    MONGO_URI: str = _build_mongo_uri()
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", os.getenv("MONGO_INITDB_DATABASE", "busyahu_db"))
    
    # Configuracion de Seguridad JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_busyahu_prog3_2026_secure")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7)  # 7 dias
    
    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

    # Configuracion de Servidor de Correo (SMTP / Gmail / Outlook)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com").strip() or "smtp.gmail.com"
    SMTP_PORT: int = _get_int("SMTP_PORT", 587)
    _env_smtp_user = os.getenv("SMTP_USER", os.getenv("EMAIL_USER", "")).strip()
    SMTP_USER: str = _env_smtp_user or _FALLBACK_SMTP_USER
    _env_smtp_password = os.getenv(
        "SMTP_PASSWORD", 
        os.getenv("SMTP_PASS", os.getenv("EMAIL_APP_PASSWORD", os.getenv("EMAIL_PASS", "")))
    ).strip()
    SMTP_PASSWORD: str = _env_smtp_password or _FALLBACK_SMTP_PASSWORD
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "BusYahu Rail").strip() or "BusYahu Rail"
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "").strip()
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    # WalletWallet API (generación de passes para Apple/Google Wallet)
    WALLETWALLET_API_KEY: str = os.getenv("WALLETWALLET_API_KEY", "").strip() or _FALLBACK_WALLET_API_KEY

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()

