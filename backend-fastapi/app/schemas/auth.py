"""
Schemas (Pydantic) específicos de autenticación.
La lógica de seguridad (bcrypt + JWT) vive en app.auth.
"""
from app.schemas.user import TokenData

__all__ = ["TokenData"]