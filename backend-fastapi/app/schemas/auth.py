from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings
from app.database import get_users_collection
from app.schemas.user import UserResponse, TokenData

# Contexto de hasheo bcrypt (compatible con salt 10 rounds de bcryptjs en Node.js)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema de seguridad HTTP Bearer
security = HTTPBearer(auto_error=True)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con el hash bcrypt guardado en MongoDB."""
    # Soporte para prefijo $2a$ común de bcryptjs reemplazado si es necesario por passlib
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera el hash seguro bcrypt de la contraseña."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT estándar HS256 firmado con JWT_SECRET.
    Garantiza interoperabilidad 100% con Express (jsonwebtoken).
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Sub representa el ID del usuario en formato string
    if "id" in to_encode and "sub" not in to_encode:
        to_encode["sub"] = str(to_encode["id"])
    if "sub" in to_encode and "id" not in to_encode:
        to_encode["id"] = str(to_encode["sub"])
        
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """
    Middleware / Dependencia para validar el token JWT y obtener el usuario activo.
    Acepta tokens generados tanto por FastAPI como por Express.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado. Inicie sesión nuevamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub") or payload.get("id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        
        if user_id is None and email is None:
            raise credentials_exception
            
        token_data = TokenData(id=user_id, email=email, role=role)
    except JWTError:
        raise credentials_exception

    users_collection = get_users_collection()
    
    # Buscar usuario por ObjectId o por email si el sub no es ObjectId válido
    user = None
    if token_data.id and ObjectId.is_valid(token_data.id):
        user = await users_collection.find_one({"_id": ObjectId(token_data.id)})
    
    if user is None and token_data.email:
        user = await users_collection.find_one({"email": token_data.email})
        
    if user is None:
        raise credentials_exception
        
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user.get("name", "Usuario"),
        role=user.get("role", "client")
    )

async def require_admin(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """
    Middleware / Dependencia para autorizar únicamente a usuarios con rol 'admin'.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren privilegios de administrador."
        )
    return current_user
