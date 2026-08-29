from contextlib import asynccontextmanager
from datetime import datetime, timezone
from http import HTTPStatus

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers.auth import router as auth_router
from app.schemas.user import ErrorResponse

_ERROR_PHRASES = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
}


def _error_name(status_code: int) -> str:
    """Frase corta del tipo de error (ej: Bad Request, Unauthorized)."""
    if status_code in _ERROR_PHRASES:
        return _ERROR_PHRASES[status_code]
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return "Error"


def _iso_now() -> str:
    """Timestamp ISO 8601 con milisegundos y sufijo Z (mismo formato que Express)."""
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def _error_body(request: Request, status_code: int, error: str, message: str) -> ErrorResponse:
    """Construye el envoltorio único de error definido en docs/openapi.yaml."""
    return ErrorResponse(
        statusCode=status_code,
        error=error,
        message=message,
        path=request.url.path,
        timestamp=_iso_now(),
    )


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
    lifespan=lifespan,
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


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Todos los errores HTTP devuelven ErrorResponse (statusCode, error, message, path, timestamp)."""
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content=_error_body(
            request,
            exc.status_code,
            _error_name(exc.status_code),
            exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Errores de validación de cuerpo → 400 con ErrorResponse (paridad con el contrato)."""
    errors = exc.errors()
    first = errors[0] if errors else {}
    loc = [str(part) for part in first.get("loc", []) if part != "body"]
    field = ".".join(loc)
    message = f"El campo {field} es inválido o falta" if field else "Cuerpo inválido"
    return JSONResponse(
        status_code=400,
        content=_error_body(request, 400, "Bad Request", message).model_dump(),
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
        "database": settings.DATABASE_NAME,
    }


@app.get("/", tags=["Sistema"])
async def root():
    return {
        "message": "Bienvenido a la API de BusYahu (FastAPI)",
        "docs": "/docs",
        "health": "/api/health",
    }