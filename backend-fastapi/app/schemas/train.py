from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field


# =============================================================================
# Schemas de trenes FastAPI — paridad 1:1 con backend-express (feat/issue-05)
# Shapes copiados literalmente de backend-express/src/controllers/trains.controller.ts
# =============================================================================

class CarriageConfig(BaseModel):
    """Configuración de un vagón tal como la almacena el seed compartido (mongo-init.js)."""
    carriageNumber: int = Field(..., description="Número del vagón", example=1)
    classType: Literal["First", "Standard"] = Field(..., description="Clase del vagón", example="First")
    totalSeats: int = Field(..., description="Capacidad total de asientos del vagón", example=20)
    rows: int = Field(..., description="Cantidad de filas", example=5)
    seatsPerRow: int = Field(..., description="Asientos por fila", example=4)


class TrainSearchItem(BaseModel):
    """Ítem del resultado de GET /api/trains/search (idéntico a Express)."""
    id: str = Field(..., description="ObjectId hexadecimal del tren", example="64e2a1b2c3d4e5f6a7b8c9d0")
    code: str = Field(..., description="Código único del tren", example="AVE-103")
    countryCode: str = Field(..., description="Código de país ISO 3166-1 alpha-2", example="ES")
    name: str = Field(..., description="Nombre del tren", example="Renfe S-103 Velaro")
    type: str = Field(..., description="Tipo de servicio", example="Alta Velocidad")
    originStationId: str = Field(..., description="ID de la estación de origen", example="ES-MAD")
    destinationStationId: str = Field(..., description="ID de la estación de destino", example="ES-BCN")
    departureTime: str = Field(..., description="Hora de salida (HH:mm)", example="08:30")
    arrivalTime: str = Field(..., description="Hora de llegada (HH:mm)", example="11:45")
    duration: str = Field(..., description="Duración estimada del trayecto", example="3h 15m")
    basePrice: float = Field(..., description="Precio base por asiento", example=65.5)
    date: str = Field(..., description="Fecha de viaje consultada (YYYY-MM-DD)", example="2026-09-04")
    carriagesCount: int = Field(..., description="Cantidad de vagones del tren", example=3)


class TrainSearchResponse(BaseModel):
    """Envelope de GET /api/trains/search (idéntico a Express)."""
    total: int = Field(..., description="Cantidad de trenes encontrados", example=1)
    trains: List[TrainSearchItem] = Field(..., description="Lista de trenes que cumplen el filtro")


class TrainSummary(BaseModel):
    """Resumen del tren embebido en una reserva (shape compacto propio de FastAPI)."""
    id: str = Field(..., description="ObjectId hexadecimal del tren", example="64e2a1b2c3d4e5f6a7b8c9d0")
    code: str = Field(..., description="Código único del tren", example="AVE-103")
    countryCode: str = Field(..., description="Código de país ISO 3166-1 alpha-2", example="ES")
    name: str = Field(..., description="Nombre del tren", example="Renfe S-103 Velaro")
    type: str = Field(..., description="Tipo de servicio", example="Alta Velocidad")
    originStationId: str = Field(..., description="ID de la estación de origen", example="ES-MAD")
    destinationStationId: str = Field(..., description="ID de la estación de destino", example="ES-BCN")
    departureTime: str = Field(..., description="Hora de salida (HH:mm)", example="08:30")
    arrivalTime: str = Field(..., description="Hora de llegada (HH:mm)", example="11:45")
    duration: str = Field(..., description="Duración estimada del trayecto", example="3h 15m")
    basePrice: float = Field(..., description="Precio base por asiento", example=65.5)


class TrainDetailResponse(BaseModel):
    """Respuesta de GET /api/trains/:id (idéntica a Express)."""
    id: str = Field(..., description="ObjectId hexadecimal del tren", example="64e2a1b2c3d4e5f6a7b8c9d0")
    code: str = Field(..., description="Código único del tren", example="AVE-103")
    countryCode: str = Field(..., description="Código de país ISO 3166-1 alpha-2", example="ES")
    name: str = Field(..., description="Nombre del tren", example="Renfe S-103 Velaro")
    type: str = Field(..., description="Tipo de servicio", example="Alta Velocidad")
    originStationId: str = Field(..., description="ID de la estación de origen", example="ES-MAD")
    destinationStationId: str = Field(..., description="ID de la estación de destino", example="ES-BCN")
    departureTime: str = Field(..., description="Hora de salida (HH:mm)", example="08:30")
    arrivalTime: str = Field(..., description="Hora de llegada (HH:mm)", example="11:45")
    duration: str = Field(..., description="Duración estimada del trayecto", example="3h 15m")
    basePrice: float = Field(..., description="Precio base por asiento", example=65.5)
    carriages: List[CarriageConfig] = Field(..., description="Configuración de vagones del tren")


# --- Mapa de asientos ---

SeatStatus = Literal["libre", "ocupado"]


class SeatItem(BaseModel):
    """Asiento individual del mapa (idéntico a Express)."""
    seatNumber: str = Field(..., description="Código único del asiento: {vagón}-{fila}{columna}", example="1-1A")
    row: int = Field(..., description="Número de fila", example=1)
    column: str = Field(..., description="Letra de columna", example="A")
    classType: Literal["First", "Standard"] = Field(..., description="Clase del asiento", example="First")
    status: SeatStatus = Field(..., description="Estado libre/ocupado en la fecha consultada", example="libre")
    price: float = Field(..., description="Precio calculado según clase", example=91.7)


class CarriageSeatsResponse(BaseModel):
    """Vagón con su matriz de asientos (idéntico a Express)."""
    carriageNumber: int = Field(..., description="Número del vagón", example=1)
    classType: Literal["First", "Standard"] = Field(..., description="Clase del vagón", example="First")
    seats: List[SeatItem] = Field(..., description="Todos los asientos del vagón")


class SeatMapResponse(BaseModel):
    """Envelope de GET /api/trains/:id/seats (idéntico a Express)."""
    trainId: str = Field(..., description="ObjectId hexadecimal del tren o su código", example="64e2a1b2c3d4e5f6a7b8c9d0")
    trainCode: str = Field(..., description="Código del tren", example="AVE-103")
    trainName: str = Field(..., description="Nombre del tren", example="Renfe S-103 Velaro")
    date: str = Field(..., description="Fecha evaluada (YYYY-MM-DD)", example="2026-09-04")
    totalCarriages: int = Field(..., description="Cantidad de vagones", example=3)
    carriages: List[CarriageSeatsResponse] = Field(..., description="Matriz de asientos por vagón")