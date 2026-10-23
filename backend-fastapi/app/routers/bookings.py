import random
import base64
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.database import get_bookings_collection, get_trains_collection
from app.schemas.user import UserResponse
from app.schemas.train import TrainSummary
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


def _train_summary(train_doc: dict) -> TrainSummary:
    """Construye el resumen del tren con el shape del seed compartido (código, estaciones, clase, etc.)."""
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
        basePrice=float(train_doc.get("basePrice", 0.0))
    )


def doc_to_booking_response(doc: dict) -> BookingResponse:
    """Convierte un documento BSON de 'bookings' a BookingResponse."""
    doc_id = str(doc.get("_id") or doc.get("id"))
    train_raw = doc.get("train", {})

    seat_codes = doc.get("seats") or [p.get("seatId", "") for p in doc.get("passengers", [])]

    passengers_list = [
        PassengerItem(
            fullName=p.get("fullName", ""),
            passportId=p.get("passportId", ""),
            seatId=p.get("seatId", ""),
            seatClass=p.get("seatClass", "Standard"),
            price=float(p.get("price", 0.0))
        )
        for p in doc.get("passengers", [])
    ]

    return BookingResponse(
        id=doc_id,
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
        userEmail=doc.get("userEmail", "")
    )


async def _find_train(train_id: str) -> dict:
    """Busca el tren por ObjectId o por código (paridad con Express)."""
    trains_collection = get_trains_collection()
    train_doc = None
    if ObjectId.is_valid(train_id):
        train_doc = await trains_collection.find_one({"_id": ObjectId(train_id)})
    if not train_doc:
        train_doc = await trains_collection.find_one({"code": train_id})
    return train_doc


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva reserva de billete de tren con código QR",
    description="Valida que los asientos solicitados estén libres para la fecha, bloquea los asientos y genera el QR digital verificable. Persiste en la colección compartida 'bookings' con el shape que lee Express (trainId, date, seats, status)."
)
async def create_booking(
    booking_data: BookingCreateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    bookings_collection = get_bookings_collection()

    # 1. Obtener la información del tren
    target_train_id = booking_data.trainId
    if not target_train_id and booking_data.train:
        target_train_id = booking_data.train.id

    if not target_train_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar 'trainId' o el objeto 'train'."
        )

    train_doc = await _find_train(target_train_id)
    if not train_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tren con ID '{target_train_id}' no encontrado en la base de datos."
        )

    # Identificador compartido: ObjectId hex, o código si no hay _id (paridad con Express)
    train_identifier = str(train_doc["_id"]) if train_doc.get("_id") else train_doc.get("code", "")

    # 2. Control de concurrencia y bloqueo de asientos en la colección compartida
    requested_seat_codes = booking_data.seat_codes
    effective_date = booking_data.effective_date

    collision = await bookings_collection.find_one({
        "trainId": train_identifier,
        "date": effective_date,
        "status": "confirmed",
        "seats": {"$in": requested_seat_codes}
    })

    if collision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o más asientos seleccionados ya han sido reservados para esta fecha. Por favor seleccione otros asientos."
        )

    # 3. Generar código localizador alfanumérico único
    country_code = train_doc.get("countryCode", "RW")[:2].upper()
    random_num = random.randint(1000, 9999)
    booking_code = f"RW-{country_code}-{random_num}"

    # 4. Generar carga y código QR digital usando qrcode
    first_passenger_name = booking_data.passengers[0].fullName.upper().replace(" ", "_")
    qr_payload = f"RAILWORLD-VERIFIED:{booking_code}:{train_doc.get('code')}:{first_passenger_name}"
    qr_code_image_data = generate_qr_base64(qr_payload)

    # 5. Estructurar documento completo para MongoDB (shape compartido con Express)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
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
        "createdAt": now_str,
        "status": "confirmed",
        "qrPayload": qr_payload,
        "qrCode": qr_code_image_data,
        "userEmail": current_user.email,
        "userId": current_user.id
    }

    result = await bookings_collection.insert_one(booking_doc)
    booking_doc["_id"] = result.inserted_id

    return doc_to_booking_response(booking_doc)


@router.get(
    "/my-bookings",
    response_model=List[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Listado de reservas del usuario autenticado",
    description="Devuelve el historial de billetes emitidos por el usuario actual."
)
async def get_my_bookings(current_user: UserResponse = Depends(get_current_user)):
    bookings_collection = get_bookings_collection()

    query = {
        "$or": [
            {"userEmail": current_user.email},
            {"userId": current_user.id}
        ]
    }

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

    booking_code = (
        booking.get("bookingCode")
        or booking.get("booking_code")
        or booking.get("bookingCode")
        or "N/A"
    )

    qr_code = booking.get("qrCode") or booking.get("qr_code")
    train = booking.get("train") or {}
    qr_payload = (
        booking.get("qrPayload")
        or booking.get("qr_payload")
        or f"RAILWORLD-VERIFIED:{booking_code}:{train.get('trainNumber') or train.get('code') or ''}:{(booking.get('passengers') or [{}])[0].get('fullName','') if booking.get('passengers') else ''}"
    )

    qr_png_bytes = None
    if isinstance(qr_code, str) and qr_code.startswith("data:image"):
        try:
            qr_png_bytes = base64.b64decode(qr_code.split(",", 1)[1])
        except Exception:
            qr_png_bytes = None

    if qr_png_bytes is None:
        generated = generate_qr_base64(str(qr_payload))
        if isinstance(generated, str) and generated.startswith("data:image"):
            try:
                qr_png_bytes = base64.b64decode(generated.split(",", 1)[1])
            except Exception:
                qr_png_bytes = None

    try:
        pdf_bytes = build_ticket_pdf(booking, qr_png_bytes)
    except Exception as e:
        return {"success": False, "configured": True, "message": f"No se pudo generar el PDF: {e}", "qrCode": qr_code}

    html_body = f"""
    <div style="font-family:sans-serif;padding:16px;">
      <h2>BusYahu Rail - Tu billete</h2>
      <p>Adjuntamos el comprobante en PDF con el codigo QR de acceso al tren.</p>
      <p><strong>Localizador:</strong> {booking_code}</p>
      <p><strong>Fecha de viaje:</strong> {booking.get('travelDate') or booking.get('date') or ''}</p>
      <div style="margin:16px 0;text-align:center;">
        <img src="cid:qrimage" alt="QR de acceso" style="width:160px;height:160px;border:1px solid #ddd;padding:8px;" />
      </div>
    </div>
    """
    text_body = f"BusYahu Rail - Tu billete\nLocalizador: {booking_code}\nAdjuntamos el PDF con el QR."

    from app.utils.email_service import send_ticket_email
    res = send_ticket_email(
        recipient=recipient,
        subject=f"BusYahu - Billete {booking_code}",
        text_body=text_body,
        html_body=html_body,
        pdf_bytes=pdf_bytes,
        pdf_filename=f"billete_{booking_code}.pdf",
        qr_png_bytes=qr_png_bytes,
    )

    qr_response = qr_code
    if not (isinstance(qr_response, str) and qr_response.startswith("data:image")) and qr_png_bytes:
        qr_response = "data:image/png;base64," + base64.b64encode(qr_png_bytes).decode("utf-8")

    return {
        "success": res.get("success", False),
        "configured": res.get("configured", False),
        "message": res.get("message") or res.get("error") or "",
        "qrCode": qr_response,
    }


@router.post("/{booking_id}/wallet", summary="Genera pass de Wallet (Apple/Google) y lo envía por correo")
async def generate_wallet_pass(booking_id: str, payload: dict = None, current_user: UserResponse = Depends(get_current_user)):
    """Genera un pass de WalletWallet on-demand y envía el email con el archivo/link correspondiente."""
    bookings_collection = get_bookings_collection()

    booking = None
    doc_filter = None
    if ObjectId.is_valid(booking_id):
        doc_filter = {"_id": ObjectId(booking_id)}
        booking = await bookings_collection.find_one(doc_filter)
    if not booking:
        doc_filter = {"bookingCode": booking_id}
        booking = await bookings_collection.find_one(doc_filter)

    if not booking:
        raise HTTPException(status_code=404, detail=f"Reserva '{booking_id}' no encontrada.")

    is_owner = (
        booking.get("userEmail") == current_user.email or
        booking.get("userId") == current_user.id
    )
    if not is_owner and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado.")

    platform = "both"
    if isinstance(payload, dict):
        platform = (payload.get("platform") or "both").lower()

    # Reutilizar pass existente si ya fue generado
    wallet_serial = booking.get("walletSerial")
    wallet_google = booking.get("walletGoogleSaveUrl")
    wallet_share = booking.get("walletShareUrl")
    wallet_apple_b64 = booking.get("walletApplePass")

    if not wallet_serial:
        try:
            wallet_data = create_wallet_pass(booking)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"No se pudo generar el pass de Wallet: {e}")
        wallet_serial = wallet_data.get("serialNumber")
        wallet_google = wallet_data.get("googleSaveUrl")
        wallet_share = wallet_data.get("shareUrl")
        wallet_apple_b64 = wallet_data.get("applePass")
        await bookings_collection.update_one(
            doc_filter,
            {"$set": {
                "walletSerial": wallet_serial,
                "walletGoogleSaveUrl": wallet_google,
                "walletShareUrl": wallet_share,
                "walletApplePass": wallet_apple_b64,
            }}
        )

    recipient = booking.get("userEmail") or current_user.email
    booking_code = booking.get("bookingCode", "N/A")
    train = booking.get("train") or {}
    qr_code = booking.get("qrCode")

    # Generar PDF y QR
    qr_png_bytes = None
    if isinstance(qr_code, str) and qr_code.startswith("data:image"):
        try:
            qr_png_bytes = base64.b64decode(qr_code.split(",", 1)[1])
        except Exception:
            qr_png_bytes = None
    if qr_png_bytes is None:
        generated = generate_qr_base64(str(booking.get("qrPayload") or booking_code))
        if isinstance(generated, str) and generated.startswith("data:image"):
            try:
                qr_png_bytes = base64.b64decode(generated.split(",", 1)[1])
            except Exception:
                qr_png_bytes = None

    try:
        pdf_bytes = build_ticket_pdf(booking, qr_png_bytes)
    except Exception as e:
        pdf_bytes = None

    # Adjunto wallet según plataforma
    wallet_bytes = None
    wallet_filename = "pasaje_wallet.pkpass"
    if platform in ("apple", "both") and wallet_apple_b64:
        try:
            wallet_bytes = base64.b64decode(wallet_apple_b64)
        except Exception:
            wallet_bytes = None

    # Link de Google Wallet para el cuerpo del email
    google_link_html = ""
    if wallet_google:
        google_link_html = f'<p style="margin:16px 0;"><a href="{wallet_google}" style="display:inline-block;padding:12px 20px;background:#1a73e8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Añadir a Google Wallet</a></p>'
    share_link_html = ""
    if wallet_share:
        share_link_html = f'<p style="margin:8px 0;"><a href="{wallet_share}">Ver / Añadir a Wallet (Apple o Google)</a></p>'

    html_body = f"""
    <div style="font-family:sans-serif;padding:16px;">
      <h2>BusYahu Rail - Tu billete</h2>
      <p>Adjuntamos el comprobante en PDF con el código QR de acceso al tren.</p>
      <p><strong>Localizador:</strong> {booking_code}</p>
      <p><strong>Fecha de viaje:</strong> {booking.get('travelDate') or booking.get('date') or ''}</p>
      <div style="margin:16px 0;text-align:center;">
        <img src="cid:qrimage" alt="QR de acceso" style="width:160px;height:160px;border:1px solid #ddd;padding:8px;" />
      </div>
      {google_link_html}
      {share_link_html}
    </div>
    """
    text_body = f"BusYahu Rail - Tu billete\\nLocalizador: {booking_code}\\n"

    from app.utils.email_service import send_ticket_email
    res = send_ticket_email(
        recipient=recipient,
        subject=f"BusYahu - Billete {booking_code} (Wallet)",
        text_body=text_body,
        html_body=html_body,
        pdf_bytes=pdf_bytes,
        pdf_filename=f"billete_{booking_code}.pdf",
        qr_png_bytes=qr_png_bytes,
        wallet_bytes=wallet_bytes,
        wallet_filename=wallet_filename,
    )

    return {
        "success": res.get("success", False),
        "configured": res.get("configured", False),
        "message": res.get("message") or res.get("error") or "",
        "googleSaveUrl": wallet_google,
        "shareUrl": wallet_share,
        "serialNumber": wallet_serial,
    }


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    status_code=status.HTTP_200_OK,
    summary="Detalle completo de una reserva por ID o Localizador",
    description="Obtiene los datos del billete y el código QR de acceso."
)
async def get_booking_by_id(
    booking_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    bookings_collection = get_bookings_collection()

    booking = None
    if ObjectId.is_valid(booking_id):
        booking = await bookings_collection.find_one({"_id": ObjectId(booking_id)})
    if not booking:
        booking = await bookings_collection.find_one({"bookingCode": booking_id})

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID o localizador '{booking_id}' no encontrada."
        )

    # Control de autorización
    is_owner = (
        booking.get("userEmail") == current_user.email or
        booking.get("userId") == current_user.id
    )
    if not is_owner and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene autorización para visualizar esta reserva."
        )

    return doc_to_booking_response(booking)


@router.delete(
    "/{booking_id}",
    response_model=BookingCancelResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancelar reserva y liberar asientos inmediatamente",
    description="Cambia el estado de la reserva a 'cancelled', liberando los asientos para que vuelvan a estar disponibles (Express los lee como libres con status != 'cancelled')."
)
async def cancel_booking(
    booking_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    bookings_collection = get_bookings_collection()

    booking = None
    doc_filter = None
    if ObjectId.is_valid(booking_id):
        doc_filter = {"_id": ObjectId(booking_id)}
        booking = await bookings_collection.find_one(doc_filter)
    if not booking:
        doc_filter = {"bookingCode": booking_id}
        booking = await bookings_collection.find_one(doc_filter)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID '{booking_id}' no encontrada."
        )

    # Control de permisos
    is_owner = (
        booking.get("userEmail") == current_user.email or
        booking.get("userId") == current_user.id
    )
    if not is_owner and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene autorización para cancelar esta reserva."
        )

    if booking.get("status") == "cancelled":
        return BookingCancelResponse(
            message="La reserva ya se encontraba cancelada previamente.",
            id=str(booking.get("_id") or booking_id),
            status="cancelled"
        )

    # Actualizar estado a 'cancelled'
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    await bookings_collection.update_one(
        doc_filter,
        {"$set": {"status": "cancelled", "cancelledAt": now_str}}
    )

    return BookingCancelResponse(
        message="Reserva cancelada exitosamente. Los asientos han sido liberados inmediatamente.",
        id=str(booking.get("_id") or booking_id),
        status="cancelled"
    )