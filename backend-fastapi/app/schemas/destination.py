from typing import List
from pydantic import BaseModel, Field

class CityItem(BaseModel):
    name: str = Field(..., description="Nombre de la ciudad", example="Madrid")
    station: str = Field(..., description="Nombre de la estación central", example="Madrid-Puerta de Atocha")

class DestinationResponse(BaseModel):
    id: str = Field(..., description="Código o ID único del país", example="es")
    country: str = Field(..., description="Nombre del país", example="España")
    countryCode: str = Field(..., description="Código ISO 2 caracteres", example="ES")
    flagEmoji: str = Field(..., description="Emoji de la bandera", example="🇪🇸")
    currency: str = Field(..., description="Moneda oficial", example="EUR")
    currencySymbol: str = Field(..., description="Símbolo monetario", example="€")
    cities: List[CityItem] = Field(..., description="Terminales y ciudades principales")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "es",
                "country": "España",
                "countryCode": "ES",
                "flagEmoji": "🇪🇸",
                "currency": "EUR",
                "currencySymbol": "€",
                "cities": [
                    {"name": "Madrid", "station": "Madrid-Puerta de Atocha"},
                    {"name": "Barcelona", "station": "Barcelona-Sants"}
                ]
            }
        }
