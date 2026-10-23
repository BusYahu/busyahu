"""Servicio de generación de passes para Apple/Google Wallet usando WalletWallet (walletwallet.dev).

Se invoca solo cuando el usuario lo solicita (botón 'Añadir a Wallet'), para no
consumir la cuota gratuita automáticamente.
"""

import base64
import json
import logging
import os
import urllib.request
import urllib.error

from app.config import settings

logger = logging.getLogger(__name__)

WALLET_API_BASE = "https://api.walletwallet.dev"


def _logo_data_uri() -> str:
    """Lee el logo de BusYahu y lo convierte a data URI base64."""
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "assets", "logo.png"),
        os.path.join(os.path.dirname(__file__), "..", "..", "imgs", "logo.png"),
    ]
    for path in candidates:
        path = os.path.abspath(path)
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("ascii")
                return f"data:image/png;base64,{b64}"
            except Exception as e:
                logger.warning("No se pudo leer el logo %s: %s", path, e)
    return ""


def _train_summary(booking: dict) -> dict:
    train = booking.get("train") or {}
    return train


def create_wallet_pass(booking: dict) -> dict:
    """Crea un pass en WalletWallet y devuelve los datos necesarios.

    Retorna dict con: serialNumber, googleSaveUrl, applePass (base64), shareUrl.
    Lanza Exception si falla.
    """
    api_key = (settings.WALLETWALLET_API_KEY or "").strip()
    if not api_key:
        raise RuntimeError("WALLETWALLET_API_KEY no configurada")

    booking_code = booking.get("bookingCode") or booking.get("booking_code") or "N/A"
    train = _train_summary(booking)
    from_city = train.get("fromCity") or train.get("from_city") or ""
    to_city = train.get("toCity") or train.get("to_city") or ""
    travel_date = booking.get("travelDate") or booking.get("date") or ""
    passengers = booking.get("passengers") or []
    first_passenger = passengers[0] if passengers else {}
    passenger_name = first_passenger.get("fullName") or first_passenger.get("full_name") or "Viajero"
    seat_id = first_passenger.get("seatId") or first_passenger.get("seat_id") or ""
    qr_payload = booking.get("qrPayload") or booking.get("qr_payload") or booking_code

    primary_fields = []
    if from_city and to_city:
        primary_fields.append({"label": "RUTA", "value": f"{from_city} → {to_city}"})
    if travel_date:
        primary_fields.append({"label": "FECHA", "value": str(travel_date)})
    if not primary_fields:
        primary_fields.append({"label": "BILLETE", "value": str(booking_code)})

    secondary_fields = [
        {"label": "PASAJERO", "value": str(passenger_name)[:256]},
    ]
    if seat_id:
        secondary_fields.append({"label": "ASIENTO", "value": str(seat_id)})

    header_fields = [{"label": "LOCALIZADOR", "value": str(booking_code)}]

    body = {
        "barcodeValue": str(qr_payload)[:1024],
        "barcodeFormat": "QR",
        "logoText": "BusYahu Rail",
        "organizationName": "BusYahu Rail",
        "description": f"Billete BusYahu {booking_code}",
        "primaryFields": primary_fields,
        "secondaryFields": secondary_fields,
        "headerFields": header_fields,
        "colorPreset": "blue",
        "sharingProhibited": False,
    }

    logo_uri = _logo_data_uri()
    if logo_uri:
        body["logoURL"] = logo_uri

    url = f"{WALLET_API_BASE}/api/passes?format=json"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "BusYahu/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        logger.error("WalletWallet HTTP %s: %s", e.code, err_body)
        raise RuntimeError(f"WalletWallet error {e.code}: {err_body}")
    except Exception as e:
        logger.exception("Error llamando a WalletWallet")
        raise RuntimeError(f"Error generando pass de wallet: {e}")

    return {
        "serialNumber": data.get("serialNumber"),
        "googleSaveUrl": data.get("googleSaveUrl"),
        "applePass": data.get("applePass"),  # base64 .pkpass
        "shareUrl": data.get("shareUrl"),
        "expirationDate": data.get("expirationDate"),
    }