"""
Schemas (Pydantic) del módulo de autenticación, alineados al contrato en docs/openapi.yaml.
"""
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_serializer

# Rol del usuario. 'admin' se crea por seed; 'user' por registro.
Role = Literal["user", "admin"]


def _to_iso_z(dt: datetime) -> str:
    """Serializa un datetime al mismo formato que Express (Date.toISOString()): `...T...sssZ`."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80, description="Nombre y apellido del nuevo pasajero", example="María López")
    email: EmailStr = Field(..., description="Correo electrónico único del usuario", example="maria.lopez@example.com")
    password: str = Field(..., min_length=8, max_length=128, description="Contraseña en texto plano (mínimo 8 caracteres)", example="Segura123!")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico registrado", example="pasajero@busyahu.com")
    password: str = Field(..., description="Contraseña del usuario", example="Pasajero123!")


class UserResponse(BaseModel):
    id: str = Field(..., description="Identificador único del usuario (ObjectId de MongoDB)", example="64a1e2d3c4b5a6f7e8d9c0b1")
    name: str = Field(..., min_length=2, max_length=80, description="Nombre y apellido del usuario", example="María López")
    email: str = Field(..., description="Correo electrónico único del usuario", example="maria.lopez@example.com")
    role: Role = Field(..., description="Rol del usuario ('user' por registro, 'admin' por seed)", example="user")
    createdAt: datetime = Field(..., description="Fecha de creación de la cuenta (ISO 8601)", example="2026-08-20T10:00:00.000Z")

    @field_serializer("createdAt")
    def _serialize_created_at(self, dt: datetime) -> str:
        return _to_iso_z(dt)


class AuthResponse(BaseModel):
    token: str = Field(..., description="Token JWT firmado con JWT_SECRET", example="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2NGExZTJkM2M0YjVhNmY3ZThkOWMwYjEifQ.signature_ejemplo")
    tokenType: str = Field("Bearer", description="Tipo de token", example="Bearer")
    expiresIn: int = Field(..., description="Tiempo de expiración del token en segundos", example=86400)
    user: UserResponse = Field(..., description="Datos del usuario autenticado")


class TokenData(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class ErrorResponse(BaseModel):
    statusCode: int = Field(..., description="Código HTTP del error", example=400)
    error: str = Field(..., description="Frase corta del tipo de error (ej: Bad Request, Unauthorized)", example="Bad Request")
    message: str = Field(..., description="Descripción legible y accionable del error", example="El email ya se encuentra registrado")
    path: str = Field(..., description="Ruta de la petición que originó el error", example="/api/auth/register")
    timestamp: str = Field(..., description="Momento en que ocurrió el error (ISO 8601)", example="2026-08-27T14:00:01.000Z")


__all__ = [
    "Role",
    "UserRegisterRequest",
    "UserLoginRequest",
    "UserResponse",
    "AuthResponse",
    "TokenData",
    "ErrorResponse",
]