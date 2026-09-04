from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from app.schemas.train import TrainResponse

class PassengerItem(BaseModel):
    fullName: str = Field(..., description="Nombre completo del pasajero", example="Lucas Gómez")
    passportId: str = Field(..., description="DNI o Pasaporte", example="PAS-459201")
    seatId: str = Field(..., description="Identificador del asiento reservado", example="1-A")
    seatClass: Literal["tourist", "first", "business"] = Field(default="tourist", description="Clase de asiento")
    price: float = Field(..., description="Precio del billete individual", example=65.0)

class BookingCreateRequest(BaseModel):
    trainId: Optional[str] = Field(None, description="Identificador del tren", example="es-01")
    train: Optional[TrainResponse] = Field(None, description="Objeto completo del tren (opcional si se pasa trainId)")
    travelDate: str = Field(..., description="Fecha de viaje (YYYY-MM-DD)", example="2026-09-20")
    passengers: List[PassengerItem] = Field(..., min_length=1, description="Lista de pasajeros a reservar")
    totalPrice: float = Field(..., description="Monto total cobrado", example=65.0)
    currency: Optional[str] = Field(default="EUR", description="Moneda de la transacción", example="EUR")

class BookingResponse(BaseModel):
    id: str = Field(..., description="Identificador único de la reserva en MongoDB")
    bookingCode: str = Field(..., description="Código alfanumérico localizador del billete", example="RW-ES-9841")
    train: TrainResponse = Field(..., description="Información completa del tren reservado")
    travelDate: str = Field(..., description="Fecha del viaje (YYYY-MM-DD)", example="2026-09-20")
    passengers: List[PassengerItem] = Field(..., description="Detalle de pasajeros y asientos asignados")
    totalPrice: float = Field(..., description="Importe total pagado", example=65.0)
    currency: str = Field(..., description="Moneda", example="EUR")
    createdAt: str = Field(..., description="Fecha y hora de emisión (YYYY-MM-DD HH:mm)", example="2026-08-14 09:30")
    status: Literal["confirmed", "cancelled"] = Field(..., description="Estado de la reserva", example="confirmed")
    qrPayload: str = Field(..., description="Carga textual codificada en el QR", example="RAILWORLD:RW-ES-9841:MAD-BCN:LUCAS_GOMEZ")
    qrCode: Optional[str] = Field(None, description="Data URL base64 de la imagen del código QR")
    userEmail: str = Field(..., description="Correo del usuario titular de la reserva", example="lucas.gomez@alumno.etec.um.edu.ar")

    class Config:
        populate_by_name = True

class BookingCancelResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de la operación")
    id: str = Field(..., description="ID de la reserva cancelada")
    status: Literal["cancelled"] = Field(default="cancelled", description="Nuevo estado")
