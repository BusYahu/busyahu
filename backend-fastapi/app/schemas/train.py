from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class TrainResponse(BaseModel):
    id: str = Field(..., description="ID de la ruta de tren", example="es-01")
    trainNumber: str = Field(..., description="Número de tren", example="AVE 03102")
    operator: str = Field(..., description="Operador ferroviario", example="Renfe AVE")
    country: str = Field(..., description="País del servicio", example="España")
    fromCity: str = Field(..., description="Ciudad de origen", example="Madrid")
    fromStation: str = Field(..., description="Estación de origen", example="Madrid-Puerta de Atocha")
    toCity: str = Field(..., description="Ciudad de destino", example="Barcelona")
    toStation: str = Field(..., description="Estación de destino", example="Barcelona-Sants")
    departureTime: str = Field(..., description="Hora de salida (HH:mm)", example="08:30")
    arrivalTime: str = Field(..., description="Hora de llegada (HH:mm)", example="11:00")
    duration: str = Field(..., description="Duración estimada", example="2h 30m")
    basePrice: float = Field(..., description="Precio base por asiento turista", example=65.0)
    currency: str = Field(..., description="Código de moneda", example="EUR")
    trainModel: str = Field(..., description="Modelo de convoy", example="Talgo S-103 Alta Velocidad")
    availableSeatsCount: int = Field(..., description="Cantidad de asientos disponibles", example=42)
    amenities: List[str] = Field(default=[], description="Comodidades y amenidades a bordo")

    class Config:
        populate_by_name = True

class TrainSeatResponse(BaseModel):
    id: str = Field(..., description="Identificador único del asiento (e.g. 1-A)", example="1-A")
    carNumber: int = Field(..., description="Número de vagón/coche", example=1)
    row: int = Field(..., description="Número de fila", example=1)
    column: str = Field(..., description="Columna de asiento (A, B, C, D)", example="A")
    type: Literal["window", "aisle", "table"] = Field(..., description="Ubicación física", example="window")
    seat_class: Literal["tourist", "first", "business"] = Field(..., alias="class", description="Clase del asiento")
    price: float = Field(..., description="Precio calculado para el asiento", example=65.0)
    isOccupied: bool = Field(..., description="Estado de ocupación en la fecha consultada", example=False)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "1-A",
                "carNumber": 1,
                "row": 1,
                "column": "A",
                "type": "window",
                "class": "tourist",
                "price": 65.0,
                "isOccupied": False
            }
        }

class SeatMapResponse(BaseModel):
    trainId: str = Field(..., description="ID del tren consultado")
    date: str = Field(..., description="Fecha de viaje evaluada")
    totalSeats: int = Field(..., description="Total de asientos en el tren")
    occupiedSeatsCount: int = Field(..., description="Asientos ocupados")
    availableSeatsCount: int = Field(..., description="Asientos libres")
    seats: List[TrainSeatResponse] = Field(..., description="Matriz de asientos del tren")
