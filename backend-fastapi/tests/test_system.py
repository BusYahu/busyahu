import asyncio
from types import SimpleNamespace

import pytest
from bson import ObjectId

from app import database
from app.config import _build_mongo_uri, _get_int
from app.schemas.user import UserResponse


class TestSystemEndpoints:
    def test_health_check(self, client):
        response = client.get("/api/health")

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["service"] == "backend-fastapi"

    def test_root(self, client):
        response = client.get("/")

        assert response.status_code == 200
        assert response.json()["health"] == "/api/health"

    def test_destinations_catalog(self, client):
        response = client.get("/api/destinations")

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["destinations"][0]["countryCode"] == "ES"
        assert body["destinations"][0]["stations"][0]["id"] == "ES-MAD"


class TestConfigHelpers:
    def test_get_int_defaults_and_parses(self, monkeypatch):
        monkeypatch.setenv("BUSYAHU_TEST_INT", "42")
        assert _get_int("BUSYAHU_TEST_INT", 1) == 42
        assert _get_int("BUSYAHU_TEST_INT_MISSING", 7) == 7

    def test_get_int_invalid_falls_back(self, monkeypatch):
        monkeypatch.setenv("BUSYAHU_TEST_INT_BAD", "not-a-number")
        assert _get_int("BUSYAHU_TEST_INT_BAD", 3) == 3

    def test_build_mongo_uri_prefers_environment(self, monkeypatch):
        monkeypatch.setenv("MONGO_URI", "mongodb://custom:27017/db")
        assert _build_mongo_uri() == "mongodb://custom:27017/db"

    def test_build_mongo_uri_defaults_to_localhost(self, monkeypatch):
        monkeypatch.delenv("MONGO_URI", raising=False)
        assert _build_mongo_uri() == "mongodb://localhost:27017/busyahu_db"

    def test_user_response_serializes_datetime_as_iso_z(self):
        from datetime import datetime, timezone

        user = UserResponse(
            id=str(ObjectId()),
            name="Test User",
            email="test@busyahu.com",
            role="user",
            createdAt=datetime(2026, 1, 2, 3, 4, 5, 123000, tzinfo=timezone.utc),
        )

        payload = user.model_dump(mode="json")
        assert payload["createdAt"] == "2026-01-02T03:04:05.123Z"

    def test_user_response_keeps_string_created_at(self):
        user = UserResponse(
            id=str(ObjectId()),
            name="Test User",
            email="test@busyahu.com",
            role="user",
            createdAt="2026-01-01T00:00:00.000Z",
        )

        assert user.model_dump(mode="json")["createdAt"] == "2026-01-01T00:00:00.000Z"


class TestDatabaseHelpers:
    def test_seed_inserts_when_collections_are_empty(self):
        class SeedCollection:
            def __init__(self):
                self.inserted = []

            async def count_documents(self, query):
                return 0

            async def insert_many(self, documents):
                self.inserted.extend(documents)

        class SeedDatabase:
            def __init__(self):
                self.destinations = SeedCollection()
                self.trains = SeedCollection()

            def __getitem__(self, name):
                return getattr(self, name)

        db = SeedDatabase()
        asyncio.run(database.seed_initial_data_if_empty(db))

        assert len(db.destinations.inserted) == 11
        assert len(db.trains.inserted) == 4

    def test_seed_skips_existing_collections(self):
        class SeedCollection:
            def __init__(self):
                self.inserted = []

            async def count_documents(self, query):
                return 2

            async def insert_many(self, documents):
                self.inserted.extend(documents)

        class SeedDatabase:
            def __init__(self):
                self.destinations = SeedCollection()
                self.trains = SeedCollection()

            def __getitem__(self, name):
                return getattr(self, name)

        db = SeedDatabase()
        asyncio.run(database.seed_initial_data_if_empty(db))

        assert db.destinations.inserted == []
        assert db.trains.inserted == []

    def test_seed_swallows_database_errors(self):
        class BrokenCollection:
            async def count_documents(self, query):
                raise RuntimeError("mongo caido")

        class BrokenDatabase:
            def __getitem__(self, name):
                return BrokenCollection()

        asyncio.run(database.seed_initial_data_if_empty(BrokenDatabase()))

    def test_connect_to_mongo_handles_connection_error(self, monkeypatch):
        class BrokenClient:
            def __init__(self, *args, **kwargs):
                raise RuntimeError("sin conexion")

        monkeypatch.setattr(database, "AsyncIOMotorClient", BrokenClient)

        asyncio.run(database.connect_to_mongo())

    def test_close_mongo_connection_closes_client(self):
        class Client:
            def __init__(self):
                self.closed = False

            def close(self):
                self.closed = True

        original_client = database.db_instance.client
        client = Client()
        database.db_instance.client = client
        try:
            asyncio.run(database.close_mongo_connection())
            assert client.closed is True
        finally:
            database.db_instance.client = original_client

    def test_close_mongo_connection_without_client_is_noop(self):
        original_client = database.db_instance.client
        database.db_instance.client = None
        try:
            asyncio.run(database.close_mongo_connection())
        finally:
            database.db_instance.client = original_client

    def test_get_database_creates_client_once(self, monkeypatch):
        class Client:
            def __init__(self, uri):
                self.uri = uri

            def __getitem__(self, name):
                return f"db:{name}"

        created = []

        def fake_client(uri):
            created.append(uri)
            return Client(uri)

        original = (database.db_instance.client, database.db_instance.db)
        database.db_instance.client = None
        database.db_instance.db = None
        monkeypatch.setattr(database, "AsyncIOMotorClient", fake_client)
        try:
            db = database.get_database()
            assert db == "db:busyahu_db"
            assert len(created) == 1
            assert database.get_database() is db
            assert len(created) == 1
        finally:
            database.db_instance.client, database.db_instance.db = original


class TestLifespan:
    def test_lifespan_connects_and_closes(self, monkeypatch):
        from app import main

        calls = []

        async def fake_connect():
            calls.append("connect")

        async def fake_close():
            calls.append("close")

        monkeypatch.setattr(main, "connect_to_mongo", fake_connect)
        monkeypatch.setattr(main, "close_mongo_connection", fake_close)

        async def run():
            async with main.lifespan(main.app):
                calls.append("inside")

        asyncio.run(run())
        assert calls == ["connect", "inside", "close"]
