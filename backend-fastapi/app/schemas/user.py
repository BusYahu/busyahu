from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico único del usuario", example="usuario@ejemplo.com")
    password: str = Field(..., min_length=6, description="Contraseña segura (mínimo 6 caracteres)", example="Password123!")
    name: str = Field(..., min_length=2, description="Nombre completo del usuario", example="Lucas Gómez")
    role: Optional[Literal["client", "admin"]] = Field(default="client", description="Rol del usuario en el sistema")

class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Correo electrónico registrado", example="admin@railworld.com")
    password: str = Field(..., description="Contraseña del usuario", example="Admin123!")

class UserResponse(BaseModel):
    id: str = Field(..., description="Identificador único del usuario (MongoDB ObjectID)")
    email: str = Field(..., description="Correo electrónico")
    name: str = Field(..., description="Nombre completo")
    role: str = Field(..., description="Rol del usuario ('client' o 'admin')")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "65db1f94c4892e0012ab34cd",
                "email": "lucas.gomez@alumno.etec.um.edu.ar",
                "name": "Lucas Gómez",
                "role": "client"
            }
        }

class AuthResponse(BaseModel):
    id: str = Field(..., description="Identificador único del usuario")
    email: str = Field(..., description="Correo electrónico")
    name: str = Field(..., description="Nombre completo")
    role: str = Field(..., description="Rol del usuario")
    token: str = Field(..., description="JWT Bearer Token de sesión firmado con JWT_SECRET")
    access_token: Optional[str] = Field(None, description="Alias estándar OAuth2 para el token")
    token_type: Optional[str] = Field("bearer", description="Tipo de token Bearer")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "65db1f94c4892e0012ab34cd",
                "email": "admin@railworld.com",
                "name": "Administrador RailWorld",
                "role": "admin",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }

class TokenData(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
