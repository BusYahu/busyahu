from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.database import get_users_collection
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    AuthResponse
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro de nuevo usuario",
    description="Crea una cuenta en el sistema, encripta la contraseña con bcrypt y devuelve el JWT de sesión."
)
async def register(user_data: UserRegisterRequest):
    users_collection = get_users_collection()
    
    # 1. Validar que el email no esté duplicado
    existing_user = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado en el sistema."
        )
    
    # 2. Hashear contraseña con bcrypt y preparar documento
    hashed_pwd = get_password_hash(user_data.password)
    new_user_dict = {
        "email": user_data.email.lower(),
        "passwordHash": hashed_pwd,
        "name": user_data.name.strip(),
        "role": user_data.role or "client",
        "createdAt": datetime.utcnow()
    }
    
    # 3. Guardar en MongoDB
    result = await users_collection.insert_one(new_user_dict)
    user_id = str(result.inserted_id)
    
    # 4. Generar Token JWT con paridad para Express/FastAPI
    token_payload = {
        "sub": user_id,
        "id": user_id,
        "email": new_user_dict["email"],
        "role": new_user_dict["role"]
    }
    token = create_access_token(data=token_payload)
    
    return AuthResponse(
        id=user_id,
        email=new_user_dict["email"],
        name=new_user_dict["name"],
        role=new_user_dict["role"],
        token=token,
        access_token=token,
        token_type="bearer"
    )

@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Inicio de sesión",
    description="Valida credenciales contra MongoDB y retorna el token JWT firmado."
)
async def login(credentials: UserLoginRequest):
    users_collection = get_users_collection()
    
    # 1. Buscar usuario por email
    user = await users_collection.find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas. Verifique su correo electrónico y contraseña."
        )
    
    # 2. Verificar hash de contraseña bcrypt
    is_valid = verify_password(credentials.password, user.get("passwordHash", ""))
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas. Verifique su correo electrónico y contraseña."
        )
    
    user_id = str(user["_id"])
    role = user.get("role", "client")
    email = user["email"]
    name = user.get("name", "Usuario")
    
    # 3. Generar Token JWT interoperable
    token_payload = {
        "sub": user_id,
        "id": user_id,
        "email": email,
        "role": role
    }
    token = create_access_token(data=token_payload)
    
    return AuthResponse(
        id=user_id,
        email=email,
        name=name,
        role=role,
        token=token,
        access_token=token,
        token_type="bearer"
    )

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Perfil del usuario en sesión",
    description="Devuelve la información del usuario a partir del Bearer Token JWT provisto en el header Authorization."
)
async def get_my_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user
