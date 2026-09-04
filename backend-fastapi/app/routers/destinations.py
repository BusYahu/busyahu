from typing import List
from fastapi import APIRouter, status
from app.database import get_destinations_collection
from app.schemas.destination import DestinationResponse

router = APIRouter(prefix="/api/destinations", tags=["Destinos"])

@router.get(
    "",
    response_model=List[DestinationResponse],
    status_code=status.HTTP_200_OK,
    summary="Catálogo de países y terminales ferroviarias",
    description="Retorna la lista de los 11 países soportados con sus estaciones centrales, bandera y moneda."
)
async def get_destinations():
    collection = get_destinations_collection()
    cursor = collection.find({})
    destinations = []
    
    async for doc in cursor:
        doc_id = doc.get("id") or str(doc.get("_id"))
        destinations.append(
            DestinationResponse(
                id=doc_id,
                country=doc["country"],
                countryCode=doc["countryCode"],
                flagEmoji=doc["flagEmoji"],
                currency=doc["currency"],
                currencySymbol=doc["currencySymbol"],
                cities=doc.get("cities", [])
            )
        )
        
    return destinations
