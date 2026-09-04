from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status
from app.database import get_trains_collection, get_bookings_collection
from app.schemas.train import TrainResponse, TrainSeatResponse, SeatMapResponse

router = APIRouter(prefix="/api/trains", tags=["Trenes"])

def doc_to_train_response(doc: dict) -> TrainResponse:
    """Convierte un documento de MongoDB al esquema TrainResponse."""
    doc_id = doc.get("id") or str(doc.get("_id"))
    return TrainResponse(
        id=doc_id,
        trainNumber=doc.get("trainNumber", ""),
        operator=doc.get("operator", ""),
        country=doc.get("country", ""),
        fromCity=doc.get("fromCity", ""),
        fromStation=doc.get("fromStation", ""),
        toCity=doc.get("toCity", ""),
        toStation=doc.get("toStation", ""),
        departureTime=doc.get("departureTime", ""),
        arrivalTime=doc.get("arrivalTime", ""),
        duration=doc.get("duration", ""),
        basePrice=float(doc.get("basePrice", 0.0)),
        currency=doc.get("currency", "EUR"),
        trainModel=doc.get("trainModel", ""),
        availableSeatsCount=int(doc.get("availableSeatsCount", 40)),
        amenities=doc.get("amenities", [])
    )

def generate_train_seats(base_price: float, occupied_seat_ids: set) -> List[dict]:
    """
    Genera la matriz física de asientos de un tren distribuida en 2 vagones:
    - Vagón 1: Primera Clase y Business (filas 1 a 3)
    - Vagón 2: Clase Turista (filas 4 a 8)
    """
    columns = ["A", "B", "C", "D"]
    seats = []

    # Vagón 1: 3 filas (Business y First)
    for row in range(1, 4):
        seat_class = "business" if row == 1 else "first"
        price_multiplier = 1.8 if seat_class == "business" else 1.4
        for col in columns:
            seat_id = f"{row}-{col}"
            seat_type = "window" if col in ["A", "D"] else "aisle"
            if row == 2 and col in ["B", "C"]:
                seat_type = "table"

            seats.append({
                "id": seat_id,
                "carNumber": 1,
                "row": row,
                "column": col,
                "type": seat_type,
                "class": seat_class,
                "price": round(base_price * price_multiplier, 2),
                "isOccupied": seat_id in occupied_seat_ids
            })

    # Vagón 2: 5 filas (Clase Turista)
    for row in range(4, 9):
        seat_class = "tourist"
        for col in columns:
            seat_id = f"{row}-{col}"
            seat_type = "window" if col in ["A", "D"] else "aisle"
            if row == 6 and col in ["A", "B"]:
                seat_type = "table"

            seats.append({
                "id": seat_id,
                "carNumber": 2,
                "row": row,
                "column": col,
                "type": seat_type,
                "class": seat_class,
                "price": round(base_price, 2),
                "isOccupied": seat_id in occupied_seat_ids
            })

    return seats

@router.get(
    "/search",
    response_model=List[TrainResponse],
    status_code=status.HTTP_200_OK,
    summary="Buscar rutas de trenes disponibles",
    description="Filtra trenes por origen, destino, país y fecha con ordenamiento por hora de salida."
)
@router.get(
    "",
    response_model=List[TrainResponse],
    status_code=status.HTTP_200_OK,
    summary="Listado general de trenes",
    include_in_schema=False
)
async def search_trains(
    country: Optional[str] = Query(None, description="País del trayecto"),
    fromCity: Optional[str] = Query(None, description="Ciudad de origen"),
    from_: Optional[str] = Query(None, alias="from", description="Alias de origen"),
    toCity: Optional[str] = Query(None, description="Ciudad de destino"),
    to_: Optional[str] = Query(None, alias="to", description="Alias de destino"),
    date: Optional[str] = Query(None, description="Fecha de viaje"),
    travelDate: Optional[str] = Query(None, description="Alias de fecha de viaje"),
    maxPrice: Optional[float] = Query(None, description="Precio máximo en moneda local")
):
    trains_collection = get_trains_collection()
    bookings_collection = get_bookings_collection()

    query_filter = {}

    if country:
        query_filter["country"] = {"$regex": f"^{country}$", "$options": "i"}

    origin = fromCity or from_
    if origin:
        query_filter["fromCity"] = {"$regex": f"^{origin}$", "$options": "i"}

    destination = toCity or to_
    if destination:
        query_filter["toCity"] = {"$regex": f"^{destination}$", "$options": "i"}

    if maxPrice is not None:
        query_filter["basePrice"] = {"$lte": maxPrice}

    cursor = trains_collection.find(query_filter).sort("departureTime", 1)
    results = []

    effective_date = travelDate or date

    async for doc in cursor:
        train = doc_to_train_response(doc)

        # Ajuste dinámico de disponibilidad según reservas de la fecha
        if effective_date:
            occupied_count = await bookings_collection.count_documents({
                "$or": [{"train.id": train.id}, {"trainId": train.id}],
                "travelDate": effective_date,
                "status": "confirmed"
            })
            # Restar asientos ocupados manteniendo un mínimo de 0
            train.availableSeatsCount = max(0, train.availableSeatsCount - occupied_count)

        results.append(train)

    return results

@router.get(
    "/{train_id}/seats",
    response_model=List[TrainSeatResponse],
    status_code=status.HTTP_200_OK,
    summary="Mapa interactivo de asientos de un tren",
    description="Devuelve la distribución de asientos con estado libre/ocupado en base a las reservas confirmadas en MongoDB."
)
async def get_train_seats(
    train_id: str,
    date: Optional[str] = Query(None, description="Fecha de viaje para evaluar ocupación (YYYY-MM-DD)")
):
    trains_collection = get_trains_collection()
    bookings_collection = get_bookings_collection()

    # Buscar el tren por id o ObjectId
    train = await trains_collection.find_one({"id": train_id})
    if not train and ObjectId.is_valid(train_id):
        train = await trains_collection.find_one({"_id": ObjectId(train_id)})
    if not train:
        train = await trains_collection.find_one({"trainNumber": train_id})

    if not train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el tren con identificador '{train_id}'"
        )

    # Buscar asientos ocupados en reservas confirmadas para esta fecha
    occupied_seat_ids = set()
    booking_query = {
        "$or": [{"train.id": train_id}, {"trainId": train_id}, {"train.id": train.get("id")}],
        "status": "confirmed"
    }
    if date:
        booking_query["travelDate"] = date

    cursor = bookings_collection.find(booking_query)
    async for booking in cursor:
        for passenger in booking.get("passengers", []):
            seat_id = passenger.get("seatId")
            if seat_id:
                occupied_seat_ids.add(seat_id)

    # Generar la matriz completa de asientos
    base_price = float(train.get("basePrice", 50.0))
    seats_data = generate_train_seats(base_price, occupied_seat_ids)

    # Mapear a TrainSeatResponse usando los alias para 'class'
    return [
        TrainSeatResponse(
            id=s["id"],
            carNumber=s["carNumber"],
            row=s["row"],
            column=s["column"],
            type=s["type"],
            seat_class=s["class"],
            price=s["price"],
            isOccupied=s["isOccupied"]
        )
        for s in seats_data
    ]

@router.get(
    "/{train_id}",
    response_model=TrainResponse,
    status_code=status.HTTP_200_OK,
    summary="Detalle específico de una ruta de tren",
    description="Devuelve la información de un tren por su identificador."
)
async def get_train_by_id(train_id: str):
    trains_collection = get_trains_collection()

    train = await trains_collection.find_one({"id": train_id})
    if not train and ObjectId.is_valid(train_id):
        train = await trains_collection.find_one({"_id": ObjectId(train_id)})
    if not train:
        train = await trains_collection.find_one({"trainNumber": train_id})

    if not train:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tren con ID '{train_id}' no encontrado."
        )

    return doc_to_train_response(train)
