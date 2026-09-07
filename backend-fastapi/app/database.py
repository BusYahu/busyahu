import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("fastapi")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def seed_initial_data_if_empty(db: AsyncIOMotorDatabase):
    """Inicializa datos de los 11 países y catálogo de trenes si la colección está vacía."""
    from app.initial_data import SEED_DESTINATIONS, SEED_TRAINS

    try:
        dest_count = await db["destinations"].count_documents({})
        if dest_count == 0:
            logger.info("Precargando colección 'destinations' con 11 países...")
            await db["destinations"].insert_many(SEED_DESTINATIONS)
            logger.info("Colección 'destinations' precargada con éxito.")

        train_count = await db["trains"].count_documents({})
        if train_count == 0:
            logger.info("Precargando catálogo de trenes en 'trains'...")
            await db["trains"].insert_many(SEED_TRAINS)
            logger.info("Colección 'trains' precargada con éxito.")
    except Exception as e:
        logger.warning(f"Advertencia al verificar o precargar datos iniciales: {e}")

async def connect_to_mongo():
    logger.info("Conectando a MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    logger.info(f"Conectado exitosamente a MongoDB base de datos: '{settings.DATABASE_NAME}'")
    await seed_initial_data_if_empty(db_instance.db)

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Cerrando conexión con MongoDB...")
        db_instance.client.close()
        logger.info("Conexión con MongoDB cerrada.")

def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
    return db_instance.db

def get_users_collection():
    return get_database()["users"]

def get_destinations_collection():
    return get_database()["destinations"]

def get_trains_collection():
    return get_database()["trains"]

def get_bookings_collection():
    return get_database()["bookings"]
