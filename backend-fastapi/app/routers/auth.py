from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.config import settings
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
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo pasajero",
    description="Crea una cuenta con rol 'user'. El password se hashea con bcrypt y nunca se expone en la respuesta. Público, no requiere token.",
)
async def register(user_data: UserRegisterRequest):
    users_collection = get_users_collection()

    # 1. Validar que el email no esté duplicado
    existing_user = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya se encuentra registrado",
        )

    # 2. Hashear contraseña con bcrypt y preparar documento (los admin se crean por seed)
    hashed_pwd = get_password_hash(user_data.password)
    new_user_dict = {
        "name": user_data.name.strip(),
        "email": user_data.email.lower(),
        "passwordHash": hashed_pwd,
        "role": "user",
        "createdAt": datetime.utcnow(),
    }

    # 3. Guardar en MongoDB
    result = await users_collection.insert_one(new_user_dict)

    # 4. Respuesta = User (id, name, email, role, createdAt), sin token
    return UserResponse(
        id=str(result.inserted_id),
        name=new_user_dict["name"],
        email=new_user_dict["email"],
        role=new_user_dict["role"],
        createdAt=new_user_dict["createdAt"],
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Iniciar sesión y obtener token JWT",
    description="Valida las credenciales (email + password) y devuelve un token Bearer JWT junto con los datos del usuario.",
)
async def login(credentials: UserLoginRequest):
    users_collection = get_users_collection()

    # 1. Buscar usuario por email
    user = await users_collection.find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    # 2. Verificar hash de contraseña bcrypt
    if not verify_password(credentials.password, user.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )

    user_id = str(user["_id"])
    email = user["email"]
    name = user.get("name", "Usuario")
    role = user.get("role", "user")
    created_at = user.get("createdAt", datetime.utcnow())

    # 3. Generar token JWT interoperable con Express
    token = create_access_token(data={"id": user_id, "email": email, "role": role})

    # 4. Respuesta = AuthResponse (token, tokenType, expiresIn, user)
    return AuthResponse(
        token=token,
        tokenType="Bearer",
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=user_id,
            name=name,
            email=email,
            role=role,
            createdAt=created_at,
        ),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obtener el perfil del usuario autenticado",
    description="Devuelve el perfil del usuario dueño del token. Requiere header Authorization: Bearer <token>.",
)
async def get_my_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user