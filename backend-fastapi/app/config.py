import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BusYahu API (FastAPI)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Configuracion de MongoDB
    MONGO_URI: str = os.getenv(
        "MONGO_URI", 
        "mongodb://admin:secretpassword@mongo:27017/railworld_db?authSource=admin"
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "railworld_db")
    
    # Configuracion de Seguridad JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_railworld_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 dias
    
    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "*")

    class Config:
        case_sensitive = True

settings = Settings()
