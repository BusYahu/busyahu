import os
import re
from pydantic_settings import BaseSettings

# Express usa jsonwebtoken con expiresIn: "24h", "7d", "90m" o segundos.
_JWT_EXPIRE_UNITS_MINUTES = {"s": 1 / 60, "m": 1, "h": 60, "d": 60 * 24}


def _parse_expires_to_minutes(value: str) -> int:
    """Parsea JWT_EXPIRES_IN (estilo Express) a minutos. Default: 24h."""
    match = re.fullmatch(r"(\d+)\s*([smhd])?", value.strip())
    if not match:
        return 60 * 24
    amount = int(match.group(1))
    return max(1, int(amount * _JWT_EXPIRE_UNITS_MINUTES.get(match.group(2) or "s", 60)))


class Settings(BaseSettings):
    PROJECT_NAME: str = "BusYahu API (FastAPI)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Configuracion de MongoDB (misma base y credenciales que Express y Docker Compose)
    MONGO_URI: str = os.getenv(
        "MONGO_URI",
        "mongodb://admin:Admin123!@mongo:27017/busyahu_db?authSource=admin",
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "busyahu_db")

    # Configuracion de Seguridad JWT (misma variable y expiracion que Express)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_busyahu_prog3_2026_secure")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN: str = os.getenv("JWT_EXPIRES_IN", "24h")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _parse_expires_to_minutes(
        os.getenv("JWT_EXPIRES_IN", "24h")
    )

    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

    class Config:
        case_sensitive = True


settings = Settings()