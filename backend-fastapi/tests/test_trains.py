from tests.conftest import TRAIN_ID

TRAIN_PAYLOAD = {
    "code": "TGV-9201",
    "name": "TGV Duplex Oceane",
    "countryCode": "fr",
    "originStationId": "FR-PAR",
    "destinationStationId": "FR-LYO",
    "basePrice": 58.0,
}


class TestTrainSearch:
    def test_list_trains_returns_catalog(self, client):
        response = client.get("/api/trains")

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["trains"][0]["code"] == "AVE-103"
        assert body["trains"][0]["carriagesCount"] == 1

    def test_search_filters_by_country_origin_destination_and_date(self, client):
        response = client.get(
            "/api/trains/search",
            params={"country": "es", "from": "ES-MAD", "to": "ES-BCN", "date": "2026-09-20"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert body["trains"][0]["date"] == "2026-09-20"

    def test_search_without_matches_returns_empty_list(self, client):
        response = client.get("/api/trains/search", params={"country": "JP"})

        assert response.status_code == 200
        assert response.json() == {"total": 0, "trains": []}

    def test_train_detail_by_object_id(self, client):
        response = client.get(f"/api/trains/{TRAIN_ID}")

        assert response.status_code == 200
        assert response.json()["code"] == "AVE-103"

    def test_train_detail_by_code(self, client):
        response = client.get("/api/trains/AVE-103")

        assert response.status_code == 200
        assert response.json()["id"] == str(TRAIN_ID)

    def test_train_detail_not_found_returns_404(self, client):
        response = client.get("/api/trains/NO-EXISTE")

        assert response.status_code == 404
        assert response.json()["error"] == "Not Found"


class TestSeatMap:
    def test_seat_map_marks_reserved_seat_as_occupied(self, client, collections):
        collections["bookings"].documents.append({
            "trainId": str(TRAIN_ID),
            "date": "2026-10-01",
            "seats": ["1-1A"],
            "status": "confirmed",
        })

        response = client.get(f"/api/trains/{TRAIN_ID}/seats", params={"date": "2026-10-01"})

        assert response.status_code == 200
        body = response.json()
        assert body["totalCarriages"] == 1
        assert body["carriages"][0]["seats"][0]["seatNumber"] == "1-1A"
        assert body["carriages"][0]["seats"][0]["status"] == "ocupado"
        assert body["carriages"][0]["seats"][1]["status"] == "libre"
        assert body["carriages"][0]["seats"][0]["price"] == 91.7

    def test_seat_map_ignores_cancelled_bookings(self, client, collections):
        collections["bookings"].documents.append({
            "trainId": str(TRAIN_ID),
            "date": "2026-10-02",
            "seats": ["1-1A"],
            "status": "cancelled",
        })

        response = client.get(f"/api/trains/{TRAIN_ID}/seats", params={"date": "2026-10-02"})

        assert response.status_code == 200
        assert response.json()["carriages"][0]["seats"][0]["status"] == "libre"

    def test_seat_map_train_not_found_returns_404(self, client):
        response = client.get("/api/trains/NO-EXISTE/seats")

        assert response.status_code == 404


class TestCreateTrain:
    def test_create_train_forbidden_for_regular_user(self, client, user_headers):
        response = client.post("/api/trains", json=TRAIN_PAYLOAD, headers=user_headers)

        assert response.status_code == 403
        assert "No autorizado" in response.json()["detail"]

    def test_create_train_requires_authentication(self, client):
        response = client.post("/api/trains", json=TRAIN_PAYLOAD)
        assert response.status_code == 401

    def test_create_train_validates_required_fields(self, client, admin_headers):
        response = client.post("/api/trains", json={"code": "X"}, headers=admin_headers)

        assert response.status_code == 400
        assert "Faltan campos obligatorios" in response.json()["detail"]

    def test_create_train_rejects_duplicate_code(self, client, admin_headers):
        payload = dict(TRAIN_PAYLOAD, code="AVE-103")
        response = client.post("/api/trains", json=payload, headers=admin_headers)

        assert response.status_code == 400
        assert "Ya existe" in response.json()["detail"]

    def test_create_train_success_as_admin(self, client, collections, admin_headers):
        response = client.post("/api/trains", json=TRAIN_PAYLOAD, headers=admin_headers)

        assert response.status_code == 201
        body = response.json()
        assert body["success"] is True
        assert body["code"] == "TGV-9201"
        assert any(train["code"] == "TGV-9201" for train in collections["trains"].documents)
