from fastapi import APIRouter, status
from app.database import get_destinations_collection
from app.schemas.destination import DestinationResponse, DestinationsResponse

router = APIRouter(prefix="/api/destinations", tags=["Destinos"])


@router.get(
    "",
    response_model=DestinationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Catálogo de países y terminales ferroviarias",
    description="Retorna el catálogo de los 11 países soportados con sus redes y estaciones centrales. Respuesta con paridad total sobre Express (feat/issue-05)."
)
async def get_destinations():
    collection = get_destinations_collection()
    cursor = collection.find({}).sort("countryName", 1)
    destinations = []

    async for doc in cursor:
        doc_id = str(doc.get("_id") or doc.get("id"))
        destinations.append(
            DestinationResponse(
                id=doc_id,
                countryCode=doc["countryCode"],
                countryName=doc["countryName"],
                networkName=doc["networkName"],
                currency=doc["currency"],
                symbol=doc["symbol"],
                stations=doc["stations"]
            )
        )

    return DestinationsResponse(total=len(destinations), destinations=destinations)