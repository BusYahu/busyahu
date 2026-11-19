"""
Fixtures compartidas de la suite FastAPI.

La suite no requiere MongoDB ni SMTP: se utilizan colecciones en memoria y se
monkeypatchean los getters de `app.database` y los servicios de correo/wallet.
"""
import base64
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from app.auth import create_access_token, get_password_hash
from app.main import app

PASSWORD = "Segura123!"
USER_ID = ObjectId("64a1e2d3c4b5a6f7e8d9c0b1")
ADMIN_ID = ObjectId("64a1e2d3c4b5a6f7e8d9c0b2")
OTHER_ID = ObjectId("64a1e2d3c4b5a6f7e8d9c0b3")
TRAIN_ID = ObjectId("64e2a1b2c3d4e5f6a7b8c9d0")
BOOKING_ID = ObjectId("64f2a1b2c3d4e5f6a7b8c9d9")

USER_EMAIL = "pasajero@busyahu.com"
ADMIN_EMAIL = "admin@busyahu.com"
OTHER_EMAIL = "otro@busyahu.com"

PNG_BYTES = b"\x89PNG\r\n\x1a\nfake-png"
PNG_DATA_URL = "data:image/png;base64," + base64.b64encode(PNG_BYTES).decode()


def _matches(document: dict, query: dict) -> bool:
    for key, expected in query.items():
        if key == "$or":
            if not any(_matches(document, sub) for sub in expected):
                return False
            continue

        value = document.get(key)
        if isinstance(expected, dict) and any(str(op).startswith("$") for op in expected):
            for operator, operand in expected.items():
                if operator == "$ne" and value == operand:
                    return False
                if operator == "$in":
                    candidates = operand or []
                    values = value if isinstance(value, list) else [value]
                    if not any(candidate in candidates for candidate in values):
                        return False
                if operator == "$nin" and value in (operand or []):
                    return False
                if operator == "$exists" and (key in document) != bool(operand):
                    return False
        elif value != expected:
            return False
    return True


def _sort_key(value):
    if value is None:
        return ""
    return value


class FakeCursor:
    def __init__(self, documents):
        self._documents = list(documents)
        self._index = 0

    def sort(self, keys, direction=None):
        specifications = [(keys, direction or 1)] if isinstance(keys, str) else list(keys)
        for key, order in reversed(specifications):
            self._documents.sort(key=lambda doc: _sort_key(doc.get(key)), reverse=(order == -1))
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index >= len(self._documents):
            raise StopAsyncIteration
        item = self._documents[self._index]
        self._index += 1
        return item


class FakeCollection:
    """Implementación mínima de la API de PyMongo/Motor usada por la app."""

    def __init__(self, documents=None):
        self.documents = [dict(document) for document in (documents or [])]

    async def find_one(self, query):
        for document in self.documents:
            if _matches(document, query):
                return document
        return None

    def find(self, query=None):
        query = query or {}
        return FakeCursor([doc for doc in self.documents if _matches(doc, query)])

    async def insert_one(self, document):
        stored = dict(document)
        stored.setdefault("_id", ObjectId())
        self.documents.append(stored)
        return SimpleNamespace(inserted_id=stored["_id"])

    async def update_one(self, query, update, upsert=False):
        for document in self.documents:
            if _matches(document, query):
                for key, value in (update.get("$set") or {}).items():
                    document[key] = value
                return SimpleNamespace(matched_count=1, modified_count=1)

        if upsert:
            stored = {key: value for key, value in query.items() if not str(key).startswith("$")}
            stored.update(update.get("$set") or {})
            stored.setdefault("_id", ObjectId())
            self.documents.append(stored)
            return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=stored["_id"])
        return SimpleNamespace(matched_count=0, modified_count=0)

    async def delete_one(self, query):
        for index, document in enumerate(self.documents):
            if _matches(document, query):
                del self.documents[index]
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)

    async def count_documents(self, query=None):
        query = query or {}
        return sum(1 for document in self.documents if _matches(document, query))


class FakeDatabase:
    def __init__(self, collections):
        self._collections = collections

    def __getitem__(self, name):
        return self._collections[name]


def _user_document(user_id, name, email, role):
    return {
        "_id": user_id,
        "name": name,
        "email": email,
        "passwordHash": get_password_hash(PASSWORD),
        "role": role,
        "isVerified": True,
        "createdAt": "2026-01-01 10:00",
    }


def _train_document():
    return {
        "_id": TRAIN_ID,
        "code": "AVE-103",
        "countryCode": "ES",
        "name": "Renfe S-103 Velaro",
        "type": "Alta Velocidad",
        "originStationId": "ES-MAD",
        "destinationStationId": "ES-BCN",
        "departureTime": "08:30",
        "arrivalTime": "11:45",
        "duration": "3h 15m",
        "basePrice": 65.5,
        "carriages": [
            {"carriageNumber": 1, "classType": "First", "totalSeats": 4, "rows": 1, "seatsPerRow": 4},
        ],
    }


def _booking_document():
    return {
        "_id": BOOKING_ID,
        "bookingCode": "RW-ES-9841",
        "train": _train_document(),
        "trainId": str(TRAIN_ID),
        "date": "2026-09-20",
        "travelDate": "2026-09-20",
        "seats": ["1-1A"],
        "passengers": [
            {
                "fullName": "Lucas Gomez",
                "passportId": "PAS-1",
                "seatId": "1-1A",
                "seatClass": "First",
                "price": 91.7,
            }
        ],
        "totalPrice": 91.7,
        "currency": "EUR",
        "createdAt": "2026-09-04 14:30",
        "status": "confirmed",
        "qrPayload": "RAILWORLD-VERIFIED:RW-ES-9841:AVE-103:LUCAS_GOMEZ",
        "qrCode": PNG_DATA_URL,
        "userEmail": USER_EMAIL,
        "userId": str(USER_ID),
    }


def _destination_document():
    return {
        "_id": ObjectId("64d2a1b2c3d4e5f6a7b8c9d0"),
        "countryCode": "ES",
        "countryName": "España",
        "networkName": "Renfe AVE / Iryo",
        "currency": "EUR",
        "symbol": "€",
        "stations": [
            {"id": "ES-MAD", "name": "Madrid Puerta de Atocha", "city": "Madrid"},
            {"id": "ES-BCN", "name": "Barcelona Sants", "city": "Barcelona"},
        ],
    }


@pytest.fixture
def collections():
    return {
        "users": FakeCollection([
            _user_document(USER_ID, "Pasajero Test", USER_EMAIL, "client"),
            _user_document(ADMIN_ID, "Admin Test", ADMIN_EMAIL, "admin"),
            _user_document(OTHER_ID, "Otro Test", OTHER_EMAIL, "client"),
        ]),
        "pending_verifications": FakeCollection(),
        "trains": FakeCollection([_train_document()]),
        "bookings": FakeCollection([_booking_document()]),
        "destinations": FakeCollection([_destination_document()]),
    }


@pytest.fixture
def fake_db(collections):
    return FakeDatabase(collections)


@pytest.fixture(autouse=True)
def patch_database(monkeypatch, collections, fake_db):
    """Redirige todos los accesos a MongoDB hacia las colecciones en memoria."""

    def getter(name):
        return lambda: collections[name]

    monkeypatch.setattr("app.database.get_users_collection", getter("users"))
    monkeypatch.setattr("app.database.get_trains_collection", getter("trains"))
    monkeypatch.setattr("app.database.get_bookings_collection", getter("bookings"))
    monkeypatch.setattr("app.database.get_destinations_collection", getter("destinations"))

    monkeypatch.setattr("app.auth.get_users_collection", getter("users"))

    monkeypatch.setattr("app.routers.auth.get_users_collection", getter("users"))
    monkeypatch.setattr("app.routers.auth.get_database", lambda: fake_db)
    monkeypatch.setattr("app.routers.trains.get_trains_collection", getter("trains"))
    monkeypatch.setattr("app.routers.trains.get_bookings_collection", getter("bookings"))
    monkeypatch.setattr("app.routers.bookings.get_trains_collection", getter("trains"))
    monkeypatch.setattr("app.routers.bookings.get_bookings_collection", getter("bookings"))
    monkeypatch.setattr(
        "app.routers.destinations.get_destinations_collection", getter("destinations")
    )
    return collections


@pytest.fixture
def client():
    # Sin `with`: no se ejecuta el lifespan y por lo tanto no se intenta conectar a Mongo.
    return TestClient(app)


@pytest.fixture
def default_email(monkeypatch):
    """Evita cualquier intento de envío SMTP real desde el router de auth."""
    monkeypatch.setattr(
        "app.routers.auth.send_verification_email",
        lambda recipient, code, first_name="Viajero": {
            "success": True,
            "configured": False,
            "code": code,
            "message": "Modo test",
        },
    )
    monkeypatch.setattr(
        "app.routers.auth.get_smtp_info",
        lambda: {"configured": False, "success": False, "message": "Modo test"},
    )
    monkeypatch.setattr("app.routers.auth.is_smtp_configured", lambda: False)


def make_token(user_id, email, role):
    return create_access_token({"sub": str(user_id), "id": str(user_id), "email": email, "role": role})


@pytest.fixture
def user_headers():
    return {"Authorization": f"Bearer {make_token(USER_ID, USER_EMAIL, 'client')}"}


@pytest.fixture
def admin_headers():
    return {"Authorization": f"Bearer {make_token(ADMIN_ID, ADMIN_EMAIL, 'admin')}"}


@pytest.fixture
def other_headers():
    return {"Authorization": f"Bearer {make_token(OTHER_ID, OTHER_EMAIL, 'client')}"}
