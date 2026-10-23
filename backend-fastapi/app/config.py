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
    user = os.getenv("MONGO_INITDB_ROOT_USERNAME", os.getenv("MONGO_USER", "admin")).strip()
    pwd = os.getenv("MONGO_INITDB_ROOT_PASSWORD", os.getenv("MONGO_PASSWORD", "secretpassword")).strip()
    db_name = os.getenv("DATABASE_NAME", os.getenv("MONGO_INITDB_DATABASE", "railworld_db")).strip()
    
    if not uri:
        return f"mongodb://{user}:{pwd}@mongo:27017/{db_name}?authSource=admin"
    
    if "@" not in uri and user and pwd:
        clean = uri.replace("mongodb://", "")
        separator = "&" if "?" in clean else "?"
        auth_param = "" if "authSource" in clean else f"{separator}authSource=admin"
        return f"mongodb://{user}:{pwd}@{clean}{auth_param}"
        
    if "@" in uri and "authSource" not in uri:
        separator = "&" if "?" in uri else "?"
        return f"{uri}{separator}authSource=admin"
        
    return uri

class Settings(BaseSettings):
    PROJECT_NAME: str = "BusYahu API (FastAPI)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Configuracion de MongoDB
    MONGO_URI: str = _build_mongo_uri()
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", os.getenv("MONGO_INITDB_DATABASE", "railworld_db"))
    
    # Configuracion de Seguridad JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_railworld_key_2026")
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

