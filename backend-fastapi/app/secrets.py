"""Credenciales SMTP ofuscadas (no texto plano) para que el envío de correo
funcione al clonar el repositorio sin configurar variables de entorno.

NOTA: esto es ofuscación, no cifrado fuerte. La clave está en el código;
sirve para evitar que las credenciales queden en texto plano en el repo.
"""

import base64

_KEY = b"busyahu-rail-2026"


def _xor(data: bytes, key: bytes) -> bytes:
    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data))


def _dec(enc: str) -> str:
    try:
        return _xor(base64.b64decode(enc), _KEY).decode("utf-8")
    except Exception:
        return ""


# Valores ofuscados (no texto plano)
_SMTP_USER_ENC = "AAAAAAAAAF8TCAUfbVVdU18OWxAWDA=="
_SMTP_PASSWORD_ENC = "FQYFHRQEHEEKDh0PRVREXA=="

_WALLET_API_KEY_ENC = "FQIsFQgeEHJKVg9dGlQGCgJVTBJAA1gQGkpUDw1MAlMKAltBQE5RWw=="


def get_smtp_credentials() -> tuple:
    """Devuelve (user, password) desofuscados. Vacíos si falla."""
    return _dec(_SMTP_USER_ENC), _dec(_SMTP_PASSWORD_ENC)


def get_wallet_api_key() -> str:
    """Devuelve la API key de WalletWallet desofuscada. Vacía si falla."""
    return _dec(_WALLET_API_KEY_ENC)