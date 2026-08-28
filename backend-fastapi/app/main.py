from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de la base de datos
    await connect_to_mongo()
    yield
    # Cierre de conexiones
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST de BusYahu en Python/FastAPI con paridad para Express (Trabajo Final de Programación 3)",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configuración de CORS
origins = ["*"] if settings.CORS_ORIGIN == "*" else [origin.strip() for origin in settings.CORS_ORIGIN.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth_router)

@app.get("/api/health", tags=["Sistema"])
async def health_check():
    """Healthcheck para Docker y balanceadores de carga."""
    return {
        "status": "ok",
        "service": "backend-fastapi",
        "version": settings.VERSION,
        "database": settings.DATABASE_NAME
    }

@app.get("/", tags=["Sistema"])
async def root():
    return {
        "message": "Bienvenido a la API de BusYahu (FastAPI)",
        "docs": "/docs",
        "health": "/api/health"
    }