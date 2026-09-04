import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("fastapi")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongo():
    logger.info("Conectando a MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    logger.info(f"Conectado exitosamente a MongoDB base de datos: '{settings.DATABASE_NAME}'")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Cerrando conexion con MongoDB...")
        db_instance.client.close()
        logger.info("Conexion con MongoDB cerrada.")

def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        # Inicializacion perezosa en caso de ser invocado fuera del ciclo de vida
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
    return db_instance.db

def get_users_collection():
    return get_database()["users"]
