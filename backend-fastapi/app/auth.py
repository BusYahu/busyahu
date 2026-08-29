"""
Módulo de seguridad y autenticación JWT para BusYahu (FastAPI).

Paridad estricta con el backend Express:
- Hash de contraseñas con bcrypt (compatible con bcryptjs, salt 10).
- Tokens JWT HS256 firmados con la misma variable JWT_SECRET.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_users_collection
from app.schemas.user import UserResponse

# Contexto de hasheo bcrypt (compatible con salt 10 rounds de bcryptjs en Node.js)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema de seguridad HTTP Bearer
security = HTTPBearer(auto_error=True)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con el hash bcrypt guardado en MongoDB."""
    # passlib tolera los prefijos $2a$ / $2b$ / $2y$ generados por bcryptjs.
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera el hash seguro bcrypt de la contraseña."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT HS256 firmado con JWT_SECRET.
    Interoperable 100% con Express (jsonwebtoken): mismos claims (id, email, role, exp)
    y misma expiración (JWT_EXPIRES_IN).
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # 'sub' e 'id' representan el ID del usuario en formato string
    if "id" in to_encode and "sub" not in to_encode:
        to_encode["sub"] = str(to_encode["id"])
    if "sub" in to_encode and "id" not in to_encode:
        to_encode["id"] = str(to_encode["sub"])

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """
    Dependencia / middleware que valida el Bearer token JWT y devuelve el usuario activo.
    Acepta tokens generados tanto por FastAPI como por Express.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise credentials_exception

    user_id = payload.get("sub") or payload.get("id")
    email = payload.get("email")

    if user_id is None and email is None:
        raise credentials_exception

    users_collection = get_users_collection()

    # Buscar usuario por ObjectId o por email si el sub no es un ObjectId válido
    user = None
    if user_id and ObjectId.is_valid(str(user_id)):
        user = await users_collection.find_one({"_id": ObjectId(user_id)})

    if user is None and email:
        user = await users_collection.find_one({"email": email})

    if user is None:
        raise credentials_exception

    return UserResponse(
        id=str(user["_id"]),
        name=user.get("name", "Usuario"),
        email=user["email"],
        role=user.get("role", "user"),
        createdAt=user.get("createdAt", datetime.utcnow()),
    )


def require_admin(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Dependencia / middleware para autorizar únicamente a usuarios con rol 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: se requieren permisos de administrador",
        )
    return current_user