from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from app.database import get_trains_collection, get_bookings_collection
from app.schemas.train import (
    TrainSearchResponse,
    TrainSearchItem,
    TrainDetailResponse,
    SeatMapResponse,
    CarriageSeatsResponse,
    SeatItem
)

router = APIRouter(prefix="/api/trains", tags=["Trenes"])

# Columnas soportadas por el mapa de asientos (idéntico a Express)
SEAT_COLUMNS = ["A", "B", "C", "D", "E"]

# Multiplicadores de precio por clase (idéntico a Express)
CLASS_PRICE_MULTIPLIER = {"First": 1.4, "Business": 1.8}


def _default_time(value: Optional[str], fallback: str) -> str:
    return value or fallback


def _today_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _resolve_train_query(train_id: str) -> dict:
    """Resuelve el filtro de búsqueda por ObjectId o por código (idéntico a Express)."""
    if ObjectId.is_valid(train_id):
        return {"_id": ObjectId(train_id)}
    return {"code": train_id}


def _train_identifier(doc: dict) -> str:
    """Identificador del tren: ObjectId hex, o código si el documento no tiene _id."""
    return str(doc.get("_id")) if doc.get("_id") else doc.get("code", "")


def _train_to_search_item(doc: dict, date: Optional[str]) -> TrainSearchItem:
    doc_id = str(doc.get("_id") or doc.get("id"))
    return TrainSearchItem(
        id=doc_id,
        code=doc["code"],
        countryCode=doc["countryCode"],
        name=doc["name"],
        type=doc.get("type", ""),
        originStationId=doc["originStationId"],
        destinationStationId=doc["destinationStationId"],
        departureTime=_default_time(doc.get("departureTime"), "08:30"),
        arrivalTime=_default_time(doc.get("arrivalTime"), "11:45"),
        duration=_default_time(doc.get("duration"), "3h 15m"),
        basePrice=float(doc.get("basePrice", 0.0)),
        date=date or _today_utc(),
        carriagesCount=len(doc.get("carriages") or [])
    )


@router.get(
    "/search",
    response_model=TrainSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Buscar trayectos de trenes",
    description="Filtra trenes por país, origen y destino con ordenamiento por hora de salida y precio base. Respuesta con paridad total sobre Express (feat/issue-05)."
)
async def search_trains(
    from_: Optional[str] = Query(None, alias="from", description="ID de la estación de origen"),
    to: Optional[str] = Query(None, description="ID de la estación de destino"),
    country: Optional[str] = Query(None, description="Código de país (ISO alpha-2)"),
    date: Optional[str] = Query(None, description="Fecha de viaje (YYYY-MM-DD)"),
):
    trains_collection = get_trains_collection()

    query_filter = {}
    if country:
        query_filter["countryCode"] = country.upper()
    if from_:
        query_filter["originStationId"] = from_
    if to:
        query_filter["destinationStationId"] = to

    # Criterio de Aceptación 1: ordenado por horario de salida y precio base
    cursor = trains_collection.find(query_filter).sort([
        ("departureTime", 1),
        ("basePrice", 1)
    ])

    results = []
    async for doc in cursor:
        results.append(_train_to_search_item(doc, date))

    return TrainSearchResponse(total=len(results), trains=results)


@router.get(
    "/{train_id}/seats",
    response_model=SeatMapResponse,
    status_code=status.HTTP_200_OK,
    summary="Mapa interactivo de asientos por vagón",
    description="Devuelve la matriz completa de asientos del tren con estado libre/ocupado según las reservas vigentes de la fecha en la colección compartida 'bookings'."
)
async def get_train_seats(
    train_id: str,
    date: Optional[str] = Query(None, description="Fecha de viaje para evaluar ocupación (YYYY-MM-DD)"),
):
    trains_collection = get_trains_collection()
    bookings_collection = get_bookings_collection()

    train = await trains_collection.find_one(_resolve_train_query(train_id))
    if not train:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Not Found", "message": "Tren no encontrado."}
        )

    # No usamos `_default_time` aquí: Express reemplaza la fecha por defecto solo en el query de reservas.
    target_date = date or _today_utc()
    train_identifier = _train_identifier(train)

    # Asientos ya reservados en la colección compartida 'bookings'
    bookings = bookings_collection.find({
        "trainId": train_identifier,
        "date": target_date,
        "status": {"$ne": "cancelled"}
    })

    reserved_seats_set = set()
    async for booking in bookings:
        for seat in booking.get("seats") or []:
            reserved_seats_set.add(seat)

    # Generar la matriz completa de vagones con estado ('libre' | 'ocupado')
    carriages_response = []
    for carriage in train.get("carriages") or []:
        seats = []
        multiplier = CLASS_PRICE_MULTIPLIER.get(carriage.get("classType"), 1.0)
        seat_price = round(float(train.get("basePrice", 0.0)) * multiplier, 2)

        for row in range(1, int(carriage.get("rows", 0)) + 1):
            for col_idx in range(0, int(carriage.get("seatsPerRow", 0))):
                col_letter = SEAT_COLUMNS[col_idx] if col_idx < len(SEAT_COLUMNS) else str(col_idx + 1)
                seat_code = f"{carriage.get('carriageNumber')}-{row}{col_letter}"

                is_occupied = seat_code in reserved_seats_set

                seats.append(
                    SeatItem(
                        seatNumber=seat_code,
                        row=row,
                        column=col_letter,
                        classType=carriage["classType"],
                        status="ocupado" if is_occupied else "libre",
                        price=seat_price
                    )
                )

        carriages_response.append(
            CarriageSeatsResponse(
                carriageNumber=carriage["carriageNumber"],
                classType=carriage["classType"],
                seats=seats
            )
        )

    return SeatMapResponse(
        trainId=train_identifier,
        trainCode=train["code"],
        trainName=train["name"],
        date=target_date,
        totalCarriages=len(carriages_response),
        carriages=carriages_response
    )


@router.get(
    "/{train_id}",
    response_model=TrainDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Detalle completo de un tren",
    description="Devuelve la información completa de un tren por su ObjectId o código."
)
async def get_train_by_id(train_id: str):
    trains_collection = get_trains_collection()

    train = await trains_collection.find_one(_resolve_train_query(train_id))
    if not train:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Not Found", "message": "Tren no encontrado."}
        )

    return TrainDetailResponse(
        id=str(train.get("_id") or train.get("id")),
        code=train["code"],
        countryCode=train["countryCode"],
        name=train["name"],
        type=train.get("type", ""),
        originStationId=train["originStationId"],
        destinationStationId=train["destinationStationId"],
        departureTime=_default_time(train.get("departureTime"), "08:30"),
        arrivalTime=_default_time(train.get("arrivalTime"), "11:45"),
        duration=_default_time(train.get("duration"), "3h 15m"),
        basePrice=float(train.get("basePrice", 0.0)),
        carriages=train.get("carriages") or []
    )