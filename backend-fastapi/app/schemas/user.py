"""
Schemas (Pydantic) del módulo de autenticación, alineados al contrato en docs/openapi.yaml
y compatibles con el sistema de verificación de código por correo electrónico (10 min).
"""
from datetime import datetime, timezone
from typing import Literal, Optional, Union

from pydantic import BaseModel, EmailStr, Field, field_serializer

# Rol del usuario: 'admin', 'user' (OpenAPI spec) o 'client' (Frontend)
Role = Literal["user", "admin", "client"]


def _to_iso_z(dt: datetime) -> str:
    """Serializa un datetime al mismo formato que Express (Date.toISOString()): `...T...sssZ`."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


class UserRegisterRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=80, description="Nombre y apellido del nuevo pasajero", example="María López")
    firstName: Optional[str] = Field(None, description="Nombre de pila del usuario", example="Lucas")
    lastName: Optional[str] = Field(None, description="Apellido del usuario", example="Gómez")
    dni: Optional[str] = Field(None, description="Número de DNI o documento", example="45920188")
    email: EmailStr = Field(..., description="Correo electrónico único del usuario", example="maria.lopez@example.com")
    password: str = Field(..., min_length=6, max_length=128, description="Contraseña en texto plano (mínimo 6 caracteres)", example="Segura123!")
    role: Optional[Role] = Field(default="user", description="Rol del usuario en el sistema")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico registrado", example="pasajero@busyahu.com")
    password: str = Field(..., description="Contraseña del usuario", example="Pasajero123!")


class UserResponse(BaseModel):
    id: str = Field(..., description="Identificador único del usuario (ObjectId de MongoDB)", example="64a1e2d3c4b5a6f7e8d9c0b1")
    name: str = Field(..., min_length=2, max_length=80, description="Nombre y apellido del usuario", example="María López")
    email: str = Field(..., description="Correo electrónico único del usuario", example="maria.lopez@example.com")
    role: Role = Field(default="user", description="Rol del usuario ('user' o 'client' por registro, 'admin' por seed)", example="user")
    createdAt: Optional[Union[datetime, str]] = Field(None, description="Fecha de creación de la cuenta (ISO 8601)", example="2026-08-20T10:00:00.000Z")
    firstName: Optional[str] = Field(None, description="Nombre")
    lastName: Optional[str] = Field(None, description="Apellido")
    dni: Optional[str] = Field(None, description="DNI")
    isVerified: bool = Field(default=True, description="Estado de verificación del correo")

    @field_serializer("createdAt")
    def _serialize_created_at(self, dt: Optional[Union[datetime, str]]) -> Optional[str]:
        if isinstance(dt, datetime):
            return _to_iso_z(dt)
        return dt

    class Config:
        populate_by_name = True


class AuthResponse(BaseModel):
    token: str = Field(..., description="Token JWT firmado con JWT_SECRET", example="eyJhbGciOiJIUzI1NiJ9...")
    tokenType: Optional[str] = Field("Bearer", description="Tipo de token", example="Bearer")
    token_type: Optional[str] = Field("bearer", description="Alias estándar OAuth2 para el token")
    expiresIn: Optional[int] = Field(86400, description="Tiempo de expiración del token en segundos", example=86400)
    user: Optional[UserResponse] = Field(None, description="Datos del usuario autenticado")
    # Campos planos para compatibilidad directa con el frontend
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    dni: Optional[str] = None
    role: Optional[str] = None
    isVerified: Optional[bool] = True
    access_token: Optional[str] = None


class VerifyCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo del usuario que solicita verificación", example="usuario@ejemplo.com")
    code: str = Field(..., min_length=6, max_length=6, description="Código de 6 dígitos", example="482910")


class ResendCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo al que se enviará un nuevo código", example="usuario@ejemplo.com")


class VerificationPendingResponse(BaseModel):
    success: bool = Field(..., description="Indica si el código fue emitido con éxito")
    email: str = Field(..., description="Correo al que se envió el código")
    message: str = Field(..., description="Mensaje explicativo con tiempo de validez")
    expiresInMinutes: int = Field(default=10, description="Tiempo de expiración en minutos")
    debugCode: Optional[str] = Field(None, description="Código de verificación provisto para pruebas si SMTP no está configurado")


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
    "VerifyCodeRequest",
    "ResendCodeRequest",
    "VerificationPendingResponse",
    "TokenData",
    "ErrorResponse",
]