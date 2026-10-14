import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.database import get_database, get_users_collection
from app.schemas.user import (
    UserRegisterRequest,
    VerifyCodeRequest,
    ResendCodeRequest,
    UserLoginRequest,
    UserResponse,
    AuthResponse,
    VerificationPendingResponse
)

try:
    from app.utils.email_service import send_verification_email
except Exception:
    def send_verification_email(recipient: str, code: str, first_name: str = "Viajero"):
        return {"success": True, "configured": False, "code": code}

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

def get_pending_collection():
    db = get_database()
    return db["pending_verifications"]

@router.post(
    "/register-request",
    response_model=VerificationPendingResponse,
    status_code=status.HTTP_200_OK,
    summary="Paso 1: Solicitar registro y enviar código de verificación (10 minutos)"
)
async def register_request(user_data: UserRegisterRequest):
    users_collection = get_users_collection()
    pending_collection = get_pending_collection()
    email_clean = user_data.email.lower().strip()

    existing_user = await users_collection.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado. Inicia sesión en tu cuenta."
        )

    code = f"{random.randint(100000, 999999)}"
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=10)

    hashed_pwd = get_password_hash(user_data.password)
    full_name = f"{user_data.firstName.strip()} {user_data.lastName.strip()}".strip()

    pending_doc = {
        "email": email_clean,
        "code": code,
        "firstName": user_data.firstName.strip(),
        "lastName": user_data.lastName.strip(),
        "name": full_name,
        "dni": user_data.dni.strip(),
        "passwordHash": hashed_pwd,
        "role": user_data.role or "client",
        "createdAt": now,
        "expiresAt": expires_at
    }

    await pending_collection.update_one(
        {"email": email_clean},
        {"$set": pending_doc},
        upsert=True
    )

    email_res = send_verification_email(email_clean, code, user_data.firstName)

    return VerificationPendingResponse(
        success=True,
        email=email_clean,
        message="Se ha enviado un código de verificación de 6 dígitos a tu correo electrónico (válido 10 minutos).",
        expiresInMinutes=10,
        debugCode=code if not email_res.get("configured") else None
    )

@router.post(
    "/verify-code",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Paso 2: Validar código y crear cuenta"
)
async def verify_code(request: VerifyCodeRequest):
    users_collection = get_users_collection()
    pending_collection = get_pending_collection()
    email_clean = request.email.lower().strip()
    code_clean = request.code.strip()

    pending = await pending_collection.find_one({"email": email_clean})
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una solicitud de registro pendiente para este correo."
        )

    now = datetime.utcnow()
    expires_at = pending.get("expiresAt")
    if not expires_at or now > expires_at:
        await pending_collection.delete_one({"email": email_clean})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de verificación ha expirado (validez de 10 minutos). Solicita uno nuevo."
        )

    if pending.get("code") != code_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de verificación es incorrecto."
        )

    new_user_dict = {
        "email": email_clean,
        "passwordHash": pending["passwordHash"],
        "firstName": pending.get("firstName", ""),
        "lastName": pending.get("lastName", ""),
        "name": pending.get("name", ""),
        "dni": pending.get("dni", ""),
        "role": pending.get("role", "client"),
        "isVerified": True,
        "createdAt": datetime.utcnow()
    }

    result = await users_collection.insert_one(new_user_dict)
    user_id = str(result.inserted_id)

    await pending_collection.delete_one({"email": email_clean})

    token_payload = {
        "sub": user_id,
        "id": user_id,
        "email": email_clean,
        "role": new_user_dict["role"]
    }
    token = create_access_token(data=token_payload)

    return AuthResponse(
        id=user_id,
        email=email_clean,
        name=new_user_dict["name"],
        firstName=new_user_dict["firstName"],
        lastName=new_user_dict["lastName"],
        dni=new_user_dict["dni"],
        role=new_user_dict["role"],
        isVerified=True,
        token=token,
        access_token=token,
        token_type="bearer"
    )

@router.post("/resend-code", response_model=VerificationPendingResponse)
async def resend_code(request: ResendCodeRequest):
    pending_collection = get_pending_collection()
    email_clean = request.email.lower().strip()

    pending = await pending_collection.find_one({"email": email_clean})
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay una solicitud pendiente para este correo."
        )

    new_code = f"{random.randint(100000, 999999)}"
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=10)

    await pending_collection.update_one(
        {"email": email_clean},
        {"$set": {"code": new_code, "createdAt": now, "expiresAt": expires_at}}
    )

    first_name = pending.get("firstName", "Viajero")
    email_res = send_verification_email(email_clean, new_code, first_name)

    return VerificationPendingResponse(
        success=True,
        email=email_clean,
        message="Se ha generado un nuevo código de verificación válido por 10 minutos.",
        expiresInMinutes=10,
        debugCode=new_code if not email_res.get("configured") else None
    )

@router.post("/register", response_model=VerificationPendingResponse)
async def register(user_data: UserRegisterRequest):
    return await register_request(user_data)

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLoginRequest):
    users_collection = get_users_collection()
    email_clean = credentials.email.lower().strip()

    user = await users_collection.find_one({"email": email_clean})
    if not user or not verify_password(credentials.password, user.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas. Verifica tu correo y contraseña."
        )

    user_id = str(user["_id"])
    role = user.get("role", "client")
    name = user.get("name") or f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()

    token_payload = {"sub": user_id, "id": user_id, "email": email_clean, "role": role}
    token = create_access_token(data=token_payload)

    return AuthResponse(
        id=user_id,
        email=email_clean,
        name=name,
        firstName=user.get("firstName"),
        lastName=user.get("lastName"),
        dni=user.get("dni"),
        role=role,
        isVerified=user.get("isVerified", True),
        token=token,
        access_token=token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user
