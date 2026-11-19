import random
import base64
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from app.auth import get_current_user
from app.database import get_bookings_collection, get_trains_collection
from app.schemas.user import UserResponse
from app.schemas.booking import (
    BookingCreateRequest,
    BookingResponse,
    BookingCancelResponse,
    PassengerItem
)
from app.utils.qr import generate_qr_base64
from app.utils.ticket_pdf import build_ticket_pdf
from app.utils.wallet_service import create_wallet_pass

router = APIRouter(prefix="/api/bookings", tags=["Reservas"])

# Aliases aceptados desde el frontend (camelCase es el contrato canónico).
FIELD_ALIASES = {
    "booking_code": "bookingCode",
    "travel_date": "travelDate",
    "total_price": "totalPrice",
}


# ---------------------------------------------------------------------------
# Helpers compartidos entre endpoints (eliminan duplicación de lógica)
# ---------------------------------------------------------------------------

def _train_summary(train_doc: dict) -> "TrainSummary":
    """Construye el resumen del tren con el shape del seed compartido."""
    from app.schemas.train import TrainSummary

    return TrainSummary(
        id=str(train_doc.get("_id") or train_doc.get("id")),
        code=train_doc.get("code", ""),
        countryCode=train_doc.get("countryCode", ""),
        name=train_doc.get("name", ""),
        type=train_doc.get("type", ""),
        originStationId=train_doc.get("originStationId", ""),
        destinationStationId=train_doc.get("destinationStationId", ""),
        departureTime=train_doc.get("departureTime") or "08:30",
        arrivalTime=train_doc.get("arrivalTime") or "11:45",
        duration=train_doc.get("duration") or "3h 15m",
        basePrice=float(train_doc.get("basePrice", 0.0)),
    )


def doc_to_booking_response(doc: dict) -> BookingResponse:
    """Convierte un documento BSON de 'bookings' a BookingResponse."""
    train_raw = doc.get("train", {})
    seat_codes = doc.get("seats") or [p.get("seatId", "") for p in doc.get("passengers", [])]

    passengers_list = [
        PassengerItem(
            fullName=p.get("fullName", ""),
            passportId=p.get("passportId", ""),
            seatId=p.get("seatId", ""),
            seatClass=p.get("seatClass", "Standard"),
            price=float(p.get("price", 0.0)),
        )
        for p in doc.get("passengers", [])
    ]

    return BookingResponse(
        id=str(doc.get("_id") or doc.get("id")),
        bookingCode=doc.get("bookingCode", ""),
        train=_train_summary(train_raw),
        trainId=doc.get("trainId", train_raw.get("id", "")),
        travelDate=doc.get("travelDate") or doc.get("date", ""),
        date=doc.get("date") or doc.get("travelDate", ""),
        seats=seat_codes,
        passengers=passengers_list,
        totalPrice=float(doc.get("totalPrice", 0.0)),
        currency=doc.get("currency", "EUR"),
        createdAt=doc.get("createdAt", ""),
        status=doc.get("status", "confirmed"),
        qrPayload=doc.get("qrPayload", ""),
        qrCode=doc.get("qrCode"),
        userEmail=doc.get("userEmail", ""),
    )


async def _find_train(train_id: str) -> Optional[dict]:
    """Busca el tren por ObjectId o por código (paridad con Express)."""
    trains_collection = get_trains_collection()
    train_doc = None
    if ObjectId.is_valid(train_id):
        train_doc = await trains_collection.find_one({"_id": ObjectId(train_id)})
    if not train_doc:
        train_doc = await trains_collection.find_one({"code": train_id})
    return train_doc


async def _find_booking(collection, booking_id: str) -> Tuple[Optional[dict], dict]:
    """Busca una reserva por ObjectId o localizador y devuelve (doc, filtro)."""
    if ObjectId.is_valid(booking_id):
        doc_filter = {"_id": ObjectId(booking_id)}
        booking = await collection.find_one(doc_filter)
        if booking:
            return booking, doc_filter

    doc_filter = {"bookingCode": booking_id}
    return await collection.find_one(doc_filter), doc_filter


def _is_owner(booking: dict, current_user: UserResponse) -> bool:
    return (
        booking.get("userEmail") == current_user.email
        or booking.get("userId") == current_user.id
    )


def _ensure_owner(booking: dict, current_user: UserResponse, detail: str) -> None:
    if not _is_owner(booking, current_user) and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def _decode_data_url_image(data_url) -> Optional[bytes]:
    """Decodifica un data URL base64 de imagen; devuelve None si no aplica."""
    if isinstance(data_url, str) and data_url.startswith("data:image"):
        try:
            return base64.b64decode(data_url.split(",", 1)[1])
        except Exception:
            return None
    return None


def _resolve_qr_png(booking: dict, fallback_payload: Optional[str] = None) -> Optional[bytes]:
    """Obtiene los bytes PNG del QR desde la reserva o generándolos."""
    qr_png = _decode_data_url_image(booking.get("qrCode"))
    if qr_png is None:
        payload = fallback_payload or booking.get("qrPayload") or booking.get("bookingCode") or ""
        qr_png = _decode_data_url_image(generate_qr_base64(str(payload)))
    return qr_png


def _normalize_booking_aliases(booking: dict) -> dict:
    """Propaga alias snake_case a los nombres camelCase esperados por el PDF."""
    for alias, canonical in FIELD_ALIASES.items():
        if alias in booking and canonical not in booking:
            booking[canonical] = booking[alias]
    return booking


def _wallet_link_html(wallet_google: Optional[str], wallet_share: Optional[str]) -> Tuple[str, str]:
    google_html = ""
    if wallet_google:
        google_html = (
            f'<p style="margin:16px 0;"><a href="{wallet_google}" '
            'style="display:inline-block;padding:12px 20px;background:#1a73e8;color:#fff;'
            'text-decoration:none;border-radius:8px;font-weight:bold;">'
            "Añadir a Google Wallet</a></p>"
        )
    share_html = ""
    if wallet_share:
        share_html = (
            f'<p style="margin:8px 0;"><a href="{wallet_share}">'
            "Ver / Añadir a Wallet (Apple o Google)</a></p>"
        )
    return google_html, share_html


def _ticket_email_bodies(
    booking: dict,
    booking_code: str,
    google_html: str = "",
    share_html: str = "",
) -> Tuple[str, str]:
    travel_date = booking.get("travelDate") or booking.get("date") or ""
    html_body = f"""
    <div style="font-family:sans-serif;padding:16px;">
      <h2>BusYahu Rail - Tu billete</h2>
      <p>Adjuntamos el comprobante en PDF con el código QR de acceso al tren.</p>
      <p><strong>Localizador:</strong> {booking_code}</p>
      <p><strong>Fecha de viaje:</strong> {travel_date}</p>
      <div style="margin:16px 0;text-align:center;">
        <img src="cid:qrimage" alt="QR de acceso" style="width:160px;height:160px;border:1px solid #ddd;padding:8px;" />
      </div>
      {google_html}
      {share_html}
    </div>
    """
    text_body = f"BusYahu Rail - Tu billete\nLocalizador: {booking_code}\n"
    return html_body, text_body


def _send_ticket_email(
    recipient: str,
    subject: str,
    booking: dict,
    booking_code: str,
    qr_png: Optional[bytes],
    wallet_bytes: Optional[bytes] = None,
    wallet_filename: str = "pasaje_wallet.pkpass",
    google_html: str = "",
    share_html: str = "",
) -> dict:
    from app.utils.email_service import send_ticket_email

    html_body, text_body = _ticket_email_bodies(booking, booking_code, google_html, share_html)
    pdf_bytes = None
    try:
        pdf_bytes = build_ticket_pdf(booking, qr_png)
    except Exception:
        pdf_bytes = None

    return send_ticket_email(
        recipient=recipient,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
        pdf_bytes=pdf_bytes,
        pdf_filename=f"billete_{booking_code}.pdf",
        qr_png_bytes=qr_png,
        wallet_bytes=wallet_bytes,
        wallet_filename=wallet_filename,
    )


def _wallet_email_result(
    res: dict,
    wallet_google,
    wallet_share,
    wallet_serial,
    featured,
) -> dict:
    return {
        "success": res.get("success", False),
        "configured": res.get("configured", False),
        "message": res.get("message") or res.get("error") or "",
        "googleSaveUrl": wallet_google,
        "shareUrl": wallet_share,
        "serialNumber": wallet_serial,
        "featuredActionsIncluded": featured,
    }


def _pdf_download_response(booking: dict, qr_png: Optional[bytes]) -> Response:
    try:
        pdf_bytes = build_ticket_pdf(booking, qr_png)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo generar el PDF: {e}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="billete_{booking.get("bookingCode", "")}.pdf"'
        },
    )


def _extract_wallet_options(payload) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
    """Normaliza platform y ciudades desde el payload opcional."""
    platform = "both"
    origin_city = None
    destination_city = None
    place_identifier = None
    if isinstance(payload, dict):
        platform = (payload.get("platform") or "both").lower()
        origin_city = (payload.get("originCity") or payload.get("origin_city") or "").strip() or None
        destination_city = (payload.get("destinationCity") or payload.get("destination_city") or "").strip() or None
        place_identifier = (
            payload.get("placeIdentifier")
            or payload.get("place_id")
            or payload.get("applePlaceId")
            or ""
        ).strip() or None
    return platform, origin_city, destination_city, place_identifier


def _apply_wallet_cities(
    booking: dict,
    origin_city: Optional[str],
    destination_city: Optional[str],
    place_identifier: Optional[str],
) -> dict:
    train = dict(booking.get("train") or {})
    if origin_city:
        train["fromCity"] = origin_city
    if destination_city:
        train["toCity"] = destination_city
    if place_identifier:
        train["applePlaceId"] = place_identifier
    booking["train"] = train
    return booking


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva reserva de billete de tren con código QR",
    description="Valida que los asientos solicitados estén libres para la fecha, bloquea los asientos y genera el QR digital verificable. Persiste en la colección compartida 'bookings' con el shape que lee Express (trainId, date, seats, status).",
)
async def create_booking(
    booking_data: BookingCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    bookings_collection = get_bookings_collection()

    target_train_id = booking_data.trainId
    if not target_train_id and booking_data.train:
        target_train_id = booking_data.train.id

    if not target_train_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar 'trainId' o el objeto 'train'.",
        )

    train_doc = await _find_train(target_train_id)
    if not train_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tren con ID '{target_train_id}' no encontrado en la base de datos.",
        )

    train_identifier = str(train_doc["_id"]) if train_doc.get("_id") else train_doc.get("code", "")
    requested_seat_codes = booking_data.seat_codes
    effective_date = booking_data.effective_date

    collision = await bookings_collection.find_one({
        "trainId": train_identifier,
        "date": effective_date,
        "status": "confirmed",
        "seats": {"$in": requested_seat_codes},
    })
    if collision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o más asientos seleccionados ya han sido reservados para esta fecha. Por favor seleccione otros asientos.",
        )

    country_code = train_doc.get("countryCode", "RW")[:2].upper()
    booking_code = f"RW-{country_code}-{random.randint(1000, 9999)}"
    first_passenger_name = booking_data.passengers[0].fullName.upper().replace(" ", "_")
    qr_payload = f"RAILWORLD-VERIFIED:{booking_code}:{train_doc.get('code')}:{first_passenger_name}"

    booking_doc = {
        "bookingCode": booking_code,
        "train": _train_summary(train_doc).model_dump(),
        "trainId": train_identifier,
        "date": effective_date,
        "travelDate": effective_date,
        "seats": requested_seat_codes,
        "passengers": [p.dict() for p in booking_data.passengers],
        "totalPrice": float(booking_data.totalPrice),
        "currency": train_doc.get("currency", booking_data.currency or "EUR"),
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        "status": "confirmed",
        "qrPayload": qr_payload,
        "qrCode": generate_qr_base64(qr_payload),
        "userEmail": current_user.email,
        "userId": current_user.id,
    }

    result = await bookings_collection.insert_one(booking_doc)
    booking_doc["_id"] = result.inserted_id
    return doc_to_booking_response(booking_doc)


@router.get(
    "/my-bookings",
    response_model=List[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Listado de reservas del usuario autenticado",
)
async def get_my_bookings(current_user: UserResponse = Depends(get_current_user)):
    bookings_collection = get_bookings_collection()
    query = {"$or": [{"userEmail": current_user.email}, {"userId": current_user.id}]}

    cursor = bookings_collection.find(query).sort("createdAt", -1)
    bookings = []
    async for doc in cursor:
        bookings.append(doc_to_booking_response(doc))
    return bookings


@router.post("/qr", summary="Genera un codigo QR Base64 para un payload")
async def generate_qr(payload: dict):
    """Devuelve un codigo QR (data URL base64) funcional para cualquier texto/payload."""
    data = ""
    if isinstance(payload, dict):
        data = (
            payload.get("data")
            or payload.get("payload")
            or payload.get("qrPayload")
            or payload.get("qr_payload")
            or payload.get("bookingCode")
            or payload.get("booking_code")
            or ""
        )
    if not data:
        data = "BUSYAHU-RAIL"
    return {"success": True, "qrCode": generate_qr_base64(str(data))}


@router.post("/send-direct-email", summary="Envia el billete (PDF con QR) por correo")
@router.post("/send-ticket", summary="Alias de envio de billete por correo")
async def send_direct_email(payload: dict):
    """Genera el PDF del comprobante con QR y lo envía por correo SMTP."""
    booking = {}
    if isinstance(payload, dict):
        booking = payload.get("booking") or payload.get("ticket") or payload
    if not isinstance(booking, dict):
        booking = {}

    recipient = ""
    if isinstance(payload, dict):
        recipient = (
            payload.get("recipientEmail")
            or payload.get("to")
            or payload.get("email")
            or booking.get("userEmail")
            or booking.get("user_email")
            or ""
        )
    recipient = str(recipient).strip()

    booking_code = booking.get("bookingCode") or booking.get("booking_code") or "N/A"
    train = booking.get("train") or {}
    passengers = booking.get("passengers") or []
    first_name = passengers[0].get("fullName", "") if passengers else ""
    qr_payload = (
        booking.get("qrPayload")
        or booking.get("qr_payload")
        or f"RAILWORLD-VERIFIED:{booking_code}:{train.get('trainNumber') or train.get('code') or ''}:{first_name}"
    )

    qr_png = _resolve_qr_png(booking, str(qr_payload))
    try:
        pdf_bytes = build_ticket_pdf(booking, qr_png)
    except Exception as e:
        return {
            "success": False,
            "configured": True,
            "message": f"No se pudo generar el PDF: {e}",
            "qrCode": booking.get("qrCode"),
        }

    html_body, text_body = _ticket_email_bodies(booking, booking_code)
    from app.utils.email_service import send_ticket_email

    res = send_ticket_email(
        recipient=recipient,
        subject=f"BusYahu - Billete {booking_code}",
        text_body=text_body,
        html_body=html_body,
        pdf_bytes=pdf_bytes,
        pdf_filename=f"billete_{booking_code}.pdf",
        qr_png_bytes=qr_png,
    )

    qr_response = booking.get("qrCode")
    if not (isinstance(qr_response, str) and qr_response.startswith("data:image")) and qr_png:
        qr_response = "data:image/png;base64," + base64.b64encode(qr_png).decode("utf-8")

    return {
        "success": res.get("success", False),
        "configured": res.get("configured", False),
        "message": res.get("message") or res.get("error") or "",
        "qrCode": qr_response,
    }


@router.post("/generate-pdf", summary="Genera un PDF del billete a partir de los datos enviados (sin persistir)")
async def generate_pdf_from_data(booking: dict):
    """Genera el PDF de un billete a partir del objeto de reserva enviado por el frontend."""
    if not isinstance(booking, dict) or not booking:
        raise HTTPException(status_code=400, detail="Datos de reserva inválidos.")

    _normalize_booking_aliases(booking)
    qr_png = _resolve_qr_png(booking)
    return _pdf_download_response(booking, qr_png)


@router.post("/generate-wallet", summary="Genera pass de Wallet a partir de los datos enviados y lo envía por correo")
async def generate_wallet_from_data(payload: dict):
    """Genera un pass de WalletWallet on-demand a partir del booking enviado por el frontend."""
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Datos inválidos.")

    booking = payload.get("booking") if isinstance(payload.get("booking"), dict) else payload
    if not isinstance(booking, dict) or not booking:
        raise HTTPException(status_code=400, detail="Datos de reserva inválidos.")

    _normalize_booking_aliases(booking)
    platform, origin_city, destination_city, place_identifier = _extract_wallet_options(payload)
    booking = _apply_wallet_cities(booking, origin_city, destination_city, place_identifier)

    recipient = booking.get("userEmail") or booking.get("email") or ""
    recipient = str(recipient).strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="No se encontró email del destinatario.")

    try:
        wallet_data = create_wallet_pass(booking)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo generar el pass de Wallet: {e}")

    wallet_google = wallet_data.get("googleSaveUrl")
    wallet_share = wallet_data.get("shareUrl")
    wallet_apple_b64 = wallet_data.get("applePass")
    wallet_serial = wallet_data.get("serialNumber")
    featured = wallet_data.get("featuredActionsIncluded", False)

    booking_code = booking.get("bookingCode") or booking.get("booking_code") or "N/A"
    qr_png = _resolve_qr_png(booking, booking_code)
    wallet_bytes = None
    if platform in ("apple", "both") and wallet_apple_b64:
        try:
            wallet_bytes = base64.b64decode(wallet_apple_b64)
        except Exception:
            wallet_bytes = None

    google_html, share_html = _wallet_link_html(wallet_google, wallet_share)
    res = _send_ticket_email(
        recipient=recipient,
        subject=f"BusYahu - Billete {booking_code} (Wallet)",
        booking=booking,
        booking_code=booking_code,
        qr_png=qr_png,
        wallet_bytes=wallet_bytes,
        google_html=google_html,
        share_html=share_html,
    )
    return _wallet_email_result(res, wallet_google, wallet_share, wallet_serial, featured)


@router.get("/{booking_id}/pdf", summary="Genera y devuelve el PDF del billete para imprimir/descargar")
async def get_booking_pdf(booking_id: str, current_user: UserResponse = Depends(get_current_user)):
    bookings_collection = get_bookings_collection()
    booking, _ = await _find_booking(bookings_collection, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Reserva '{booking_id}' no encontrada.")

    _ensure_owner(booking, current_user, "No autorizado.")
    return _pdf_download_response(booking, _resolve_qr_png(booking))


@router.post("/{booking_id}/wallet", summary="Genera pass de Wallet (Apple/Google) y lo envía por correo")
async def generate_wallet_pass(
    booking_id: str,
    payload: dict = None,
    current_user: UserResponse = Depends(get_current_user),
):
    """Genera un pass de WalletWallet on-demand y envía el email con el archivo/link correspondiente."""
    bookings_collection = get_bookings_collection()
    booking, doc_filter = await _find_booking(bookings_collection, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Reserva '{booking_id}' no encontrada.")

    _ensure_owner(booking, current_user, "No autorizado.")

    platform, origin_city, destination_city, place_identifier = _extract_wallet_options(payload)

    wallet_serial = booking.get("walletSerial")
    wallet_google = booking.get("walletGoogleSaveUrl")
    wallet_share = booking.get("walletShareUrl")
    wallet_apple_b64 = booking.get("walletApplePass")
    wallet_featured = booking.get("walletFeaturedActionsIncluded")

    if not wallet_serial:
        booking_for_wallet = _apply_wallet_cities(
            dict(booking), origin_city, destination_city, place_identifier
        )
        try:
            wallet_data = create_wallet_pass(booking_for_wallet)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"No se pudo generar el pass de Wallet: {e}")

        wallet_serial = wallet_data.get("serialNumber")
        wallet_google = wallet_data.get("googleSaveUrl")
        wallet_share = wallet_data.get("shareUrl")
        wallet_apple_b64 = wallet_data.get("applePass")
        wallet_featured = wallet_data.get("featuredActionsIncluded", False)
        await bookings_collection.update_one(
            doc_filter,
            {"$set": {
                "walletSerial": wallet_serial,
                "walletGoogleSaveUrl": wallet_google,
                "walletShareUrl": wallet_share,
                "walletApplePass": wallet_apple_b64,
                "walletFeaturedActionsIncluded": wallet_featured,
            }},
        )

    recipient = booking.get("userEmail") or current_user.email
    booking_code = booking.get("bookingCode", "N/A")
    qr_png = _resolve_qr_png(booking, booking_code)

    wallet_bytes = None
    if platform in ("apple", "both") and wallet_apple_b64:
        try:
            wallet_bytes = base64.b64decode(wallet_apple_b64)
        except Exception:
            wallet_bytes = None

    google_html, share_html = _wallet_link_html(wallet_google, wallet_share)
    res = _send_ticket_email(
        recipient=recipient,
        subject=f"BusYahu - Billete {booking_code} (Wallet)",
        booking=booking,
        booking_code=booking_code,
        qr_png=qr_png,
        wallet_bytes=wallet_bytes,
        google_html=google_html,
        share_html=share_html,
    )
    return _wallet_email_result(res, wallet_google, wallet_share, wallet_serial, wallet_featured)


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Detalle completo de una reserva por ID o Localizador",
)
async def get_booking_by_id(
    booking_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    bookings_collection = get_bookings_collection()
    booking, _ = await _find_booking(bookings_collection, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID o localizador '{booking_id}' no encontrada.",
        )

    _ensure_owner(
        booking,
        current_user,
        "No tiene autorización para visualizar esta reserva.",
    )
    return doc_to_booking_response(booking)


@router.delete(
    "/{booking_id}",
    response_model=BookingCancelResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancelar reserva y liberar asientos inmediatamente",
)
async def cancel_booking(
    booking_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    bookings_collection = get_bookings_collection()
    booking, doc_filter = await _find_booking(bookings_collection, booking_id)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID '{booking_id}' no encontrada.",
        )

    _ensure_owner(
        booking,
        current_user,
        "No tiene autorización para cancelar esta reserva.",
    )

    if booking.get("status") == "cancelled":
        return BookingCancelResponse(
            message="La reserva ya se encontraba cancelada previamente.",
            id=str(booking.get("_id") or booking_id),
            status="cancelled",
        )

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    await bookings_collection.update_one(
        doc_filter, {"$set": {"status": "cancelled", "cancelledAt": now_str}}
    )
    return BookingCancelResponse(
        message="Reserva cancelada exitosamente. Los asientos han sido liberados inmediatamente.",
        id=str(booking.get("_id") or booking_id),
        status="cancelled",
    )
