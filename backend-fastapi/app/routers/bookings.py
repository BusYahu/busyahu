import random
from datetime import datetime
from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.database import get_bookings_collection, get_trains_collection
from app.schemas.user import UserResponse
from app.schemas.train import TrainResponse
from app.schemas.booking import (
    BookingCreateRequest,
    BookingResponse,
    BookingCancelResponse,
    PassengerItem
)
from app.utils.qr import generate_qr_base64

router = APIRouter(prefix="/api/bookings", tags=["Reservas"])

def doc_to_booking_response(doc: dict) -> BookingResponse:
    """Convierte un documento BSON de MongoDB a BookingResponse."""
    doc_id = str(doc.get("_id") or doc.get("id"))
    train_raw = doc.get("train", {})
    train_id = train_raw.get("id") or str(train_raw.get("_id", "train"))

    train_resp = TrainResponse(
        id=train_id,
        trainNumber=train_raw.get("trainNumber", ""),
        operator=train_raw.get("operator", ""),
        country=train_raw.get("country", ""),
        fromCity=train_raw.get("fromCity", ""),
        fromStation=train_raw.get("fromStation", ""),
        toCity=train_raw.get("toCity", ""),
        toStation=train_raw.get("toStation", ""),
        departureTime=train_raw.get("departureTime", ""),
        arrivalTime=train_raw.get("arrivalTime", ""),
        duration=train_raw.get("duration", ""),
        basePrice=float(train_raw.get("basePrice", 0.0)),
        currency=train_raw.get("currency", "EUR"),
        trainModel=train_raw.get("trainModel", ""),
        availableSeatsCount=int(train_raw.get("availableSeatsCount", 40)),
        amenities=train_raw.get("amenities", [])
    )

    passengers_list = [
        PassengerItem(
            fullName=p.get("fullName", ""),
            passportId=p.get("passportId", ""),
            seatId=p.get("seatId", ""),
            seatClass=p.get("seatClass", "tourist"),
            price=float(p.get("price", 0.0))
        )
        for p in doc.get("passengers", [])
    ]

    return BookingResponse(
        id=doc_id,
        bookingCode=doc.get("bookingCode", ""),
        train=train_resp,
        travelDate=doc.get("travelDate", ""),
        passengers=passengers_list,
        totalPrice=float(doc.get("totalPrice", 0.0)),
        currency=doc.get("currency", "EUR"),
        createdAt=doc.get("createdAt", ""),
        status=doc.get("status", "confirmed"),
        qrPayload=doc.get("qrPayload", ""),
        qrCode=doc.get("qrCode"),
        userEmail=doc.get("userEmail", "")
    )

@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva reserva de billete de tren con código QR",
    description="Valida que los asientos solicitados estén libres para la fecha, simula el pago, bloquea los asientos y genera el QR digital verificable."
)
async def create_booking(
    booking_data: BookingCreateRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    trains_collection = get_trains_collection()
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

    train_doc = await trains_collection.find_one({"id": target_train_id})
    if not train_doc and ObjectId.is_valid(target_train_id):
        train_doc = await trains_collection.find_one({"_id": ObjectId(target_train_id)})
    if not train_doc and booking_data.train:
        train_doc = booking_data.train.dict()

    if not train_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tren con ID '{target_train_id}' no encontrado en la base de datos."
        )

    # 2. Control de concurrencia y bloqueo de asientos
    requested_seat_ids = [p.seatId for p in booking_data.passengers]
    train_identifier = train_doc.get("id") or str(train_doc.get("_id"))

    collision = await bookings_collection.find_one({
        "$or": [
            {"train.id": train_identifier},
            {"trainId": train_identifier},
            {"train.id": target_train_id}
        ],
        "travelDate": booking_data.travelDate,
        "status": "confirmed",
        "passengers.seatId": {"$in": requested_seat_ids}
    })

    if collision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o más asientos seleccionados ya han sido reservados para esta fecha. Por favor seleccione otros asientos."
        )

    # 3. Generar código localizador alfanumérico único
    country_code = train_doc.get("country", "RW")[:2].upper()
    random_num = random.randint(1000, 9999)
    booking_code = f"RW-{country_code}-{random_num}"

    # 4. Generar carga y código QR digital usando qrcode
    first_passenger_name = booking_data.passengers[0].fullName.upper().replace(" ", "_")
    qr_payload = f"RAILWORLD-VERIFIED:{booking_code}:{train_doc.get('trainNumber')}:{first_passenger_name}"
    qr_code_image_data = generate_qr_base64(qr_payload)

    # 5. Estructurar documento completo para MongoDB
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    booking_doc = {
        "bookingCode": booking_code,
        "train": {
            "id": train_identifier,
            "trainNumber": train_doc.get("trainNumber"),
            "operator": train_doc.get("operator"),
            "country": train_doc.get("country"),
            "fromCity": train_doc.get("fromCity"),
            "fromStation": train_doc.get("fromStation"),
            "toCity": train_doc.get("toCity"),
            "toStation": train_doc.get("toStation"),
            "departureTime": train_doc.get("departureTime"),
            "arrivalTime": train_doc.get("arrivalTime"),
            "duration": train_doc.get("duration"),
            "basePrice": float(train_doc.get("basePrice", 0.0)),
            "currency": train_doc.get("currency", "EUR"),
            "trainModel": train_doc.get("trainModel"),
            "availableSeatsCount": train_doc.get("availableSeatsCount", 40),
            "amenities": train_doc.get("amenities", [])
        },
        "trainId": train_identifier,
        "travelDate": booking_data.travelDate,
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
        booking = await bookings_collection.find_one({"id": booking_id})

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
    description="Cambia el estado de la reserva a 'cancelled', liberando los asientos para que vuelvan a estar disponibles."
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
        doc_filter = {"id": booking_id}
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
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    await bookings_collection.update_one(
        doc_filter,
        {"$set": {"status": "cancelled", "cancelledAt": now_str}}
    )

    return BookingCancelResponse(
        message="Reserva cancelada exitosamente. Los asientos han sido liberados inmediatamente.",
        id=str(booking.get("_id") or booking_id),
        status="cancelled"
    )
