from typing import List
from pydantic import BaseModel, Field


# =============================================================================
# Schemas de destinos FastAPI — paridad 1:1 con backend-express (feat/issue-05)
# Shape copiado literalmente de getDestinations en trains.controller.ts
# =============================================================================

class Station(BaseModel):
    """Estación de un destino tal como la almacena el seed compartido (mongo-init.js)."""
    id: str = Field(..., description="ID único de la estación", example="ES-MAD")
    name: str = Field(..., description="Nombre de la estación", example="Madrid Puerta de Atocha")
    city: str = Field(..., description="Ciudad donde se ubica la estación", example="Madrid")


class DestinationResponse(BaseModel):
    """Ítem del catálogo de destinos (idéntico a Express)."""
    id: str = Field(..., description="ObjectId hexadecimal del país/destino", example="64e2a1b2c3d4e5f6a7b8c9d1")
    countryCode: str = Field(..., description="Código de país ISO 3166-1 alpha-2", example="ES")
    countryName: str = Field(..., description="Nombre del país", example="España")
    networkName: str = Field(..., description="Red ferroviaria del país", example="Renfe AVE / Iryo")
    currency: str = Field(..., description="Moneda oficial", example="EUR")
    symbol: str = Field(..., description="Símbolo monetario", example="€")
    stations: List[Station] = Field(..., description="Estaciones centrales del país")


class DestinationsResponse(BaseModel):
    """Envelope de GET /api/destinations (idéntico a Express)."""
    total: int = Field(..., description="Cantidad de destinos", example=11)
    destinations: List[DestinationResponse] = Field(..., description="Catálogo de países y estaciones")