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
    from app.utils.email_service import (
        send_verification_email,
        get_smtp_info,
        is_smtp_configured
    )
except Exception:
    def send_verification_email(recipient: str, code: str, first_name: str = "Viajero"):
        return {"success": True, "configured": False, "code": code}
    def get_smtp_info():
        return {"configured": False, "message": "SMTP no disponible"}
    def is_smtp_configured():
        return False

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

    try:
        existing_user = await users_collection.find_one({"email": email_clean})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos ({e}). Verifica que MONGO_URI incluya credenciales y authSource=admin."
        )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado. Inicia sesión en tu cuenta."
        )

    code = f"{random.randint(100000, 999999)}"
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=10)

    hashed_pwd = get_password_hash(user_data.password)
    first_name = (user_data.firstName or "").strip()
    last_name = (user_data.lastName or "").strip()
    full_name = (user_data.name or "").strip()
    if not full_name:
        full_name = f"{first_name} {last_name}".strip() or "Viajero"
    if not first_name:
        parts = full_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    dni_val = (user_data.dni or "").strip()

    pending_doc = {
        "email": email_clean,
        "code": code,
        "firstName": first_name,
        "lastName": last_name,
        "name": full_name,
        "dni": dni_val,
        "passwordHash": hashed_pwd,
        "role": user_data.role or "user",
        "createdAt": now,
        "expiresAt": expires_at
    }

    await pending_collection.update_one(
        {"email": email_clean},
        {"$set": pending_doc},
        upsert=True
    )

    email_res = send_verification_email(email_clean, code, first_name)
 
    if not email_res.get("success"):
        err_detail = email_res.get("error") or email_res.get("message") or "Error desconocido al enviar correo"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo enviar el correo de verificación a {email_clean}: {err_detail}"
        )
 
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
 
    if not email_res.get("success"):
        err_msg = email_res.get("error") or email_res.get("message") or "Error al reenviar correo por SMTP"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo reenviar el correo a {email_clean}: {err_msg}"
        )
 
    return VerificationPendingResponse(
        success=True,
        email=email_clean,
        message="Se ha reenviado un nuevo código de verificación a tu correo (válido 10 minutos).",
        expiresInMinutes=10,
        debugCode=new_code if not email_res.get("configured") else None
    )

@router.get("/smtp-status", tags=["Autenticación"])
async def get_auth_smtp_status():
    """Retorna información sobre la configuración y estado del servidor de correos SMTP."""
    return get_smtp_info()

@router.post("/test-email", tags=["Autenticación"])
async def trigger_test_email(request: ResendCodeRequest):
    """Envía un código de prueba y devuelve el resultado detallado para verificar SMTP."""
    test_code = f"{random.randint(100000, 999999)}"
    res = send_verification_email(request.email, test_code, "Usuario de Prueba")
    return {
        "success": res.get("success", False),
        "configured": res.get("configured", False),
        "result": res,
        "testCode": test_code,
        "recipient": request.email
    }

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
