import random
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