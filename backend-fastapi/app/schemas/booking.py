from typing import List, Literal, Optional, Union
from pydantic import BaseModel, Field
from app.schemas.train import TrainSummary


# =============================================================================
# Schemas de reservas FastAPI
# Persistencia alineada al esquema compartido que lee Express (getTrainSeats):
#   bookings: { trainId: hex|code, date: YYYY-MM-DD, seats: [seatCode...], status: confirmed|cancelled }
# =============================================================================

class PassengerItem(BaseModel):
    """Pasajero con su asiento asignado."""
    fullName: str = Field(..., description="Nombre completo del pasajero", example="Lucas Gómez")
    passportId: str = Field(..., description="DNI o Pasaporte", example="PAS-459201")
    seatId: str = Field(..., description="Código del asiento reservado", example="1-1A")
    seatClass: Literal["First", "Standard"] = Field(default="Standard", description="Clase de asiento", example="Standard")
    price: float = Field(..., description="Precio del billete individual", example=91.7)


class BookingCreateRequest(BaseModel):
    trainId: Optional[str] = Field(None, description="Identificador del tren (ObjectId hex o código)", example="AVE-103")
    train: Optional[TrainSummary] = Field(None, description="Resumen del tren (alternativa a trainId)")
    travelDate: str = Field(..., description="Fecha de viaje (YYYY-MM-DD)", example="2026-09-20")
    passengers: List[PassengerItem] = Field(..., min_length=1, description="Lista de pasajeros a reservar")
    totalPrice: float = Field(..., description="Monto total cobrado", example=91.7)
    currency: Optional[str] = Field(default="EUR", description="Moneda de la transacción", example="EUR")

    @property
    def effective_date(self) -> str:
        """Fecha canónica usada en la colección compartida 'bookings' (campo 'date')."""
        return self.travelDate

    @property
    def seat_codes(self) -> List[str]:
        """Códigos de asiento normalizados a partir de los pasajeros."""
        return [p.seatId for p in self.passengers]


class BookingResponse(BaseModel):
    id: str = Field(..., description="Identificador único de la reserva en MongoDB")
    bookingCode: str = Field(..., description="Código alfanumérico localizador del billete", example="RW-ES-9841")
    train: TrainSummary = Field(..., description="Información resumida del tren reservado")
    trainId: str = Field(..., description="Identificador del tren (ObjectId hex o código)", example="64e2a1b2c3d4e5f6a7b8c9d0")
    travelDate: str = Field(..., description="Fecha del viaje (YYYY-MM-DD)", example="2026-09-20")
    date: str = Field(..., description="Fecha del viaje canónica para Express (YYYY-MM-DD)", example="2026-09-20")
    seats: List[str] = Field(..., description="Códigos de asiento reservados (visibles por Express)", example=["1-1A", "1-1B"])
    passengers: List[PassengerItem] = Field(..., description="Detalle de pasajeros y asientos asignados")
    totalPrice: float = Field(..., description="Importe total pagado", example=91.7)
    currency: str = Field(..., description="Moneda", example="EUR")
    createdAt: str = Field(..., description="Fecha y hora de emisión (YYYY-MM-DD HH:mm)", example="2026-09-04 14:30")
    status: Literal["confirmed", "cancelled"] = Field(..., description="Estado de la reserva", example="confirmed")
    qrPayload: str = Field(..., description="Carga textual codificada en el QR", example="RAILWORLD-VERIFIED:RW-ES-9841:AVE-103:LUCAS_GOMEZ")
    qrCode: Optional[str] = Field(None, description="Data URL base64 de la imagen del código QR")
    userEmail: str = Field(..., description="Correo del usuario titular de la reserva", example="lucas.gomez@alumno.etec.um.edu.ar")

    class Config:
        populate_by_name = True


class BookingCancelResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de la operación")
    id: str = Field(..., description="ID de la reserva cancelada")
    status: Literal["cancelled"] = Field(default="cancelled", description="Nuevo estado")