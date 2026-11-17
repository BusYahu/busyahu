import base64

import pytest

from tests.conftest import BOOKING_ID, TRAIN_ID, PNG_BYTES, PNG_DATA_URL

WALLET_DATA = {
    "serialNumber": "SERIAL-1",
    "googleSaveUrl": "https://wallet.example/google",
    "shareUrl": "https://wallet.example/share",
    "applePass": base64.b64encode(b"pkpass").decode(),
    "featuredActionsIncluded": True,
}


@pytest.fixture(autouse=True)
def fast_documents(monkeypatch):
    """Evita generar PDFs/QRs reales; los tests de utils cubren esas ramas."""
    monkeypatch.setattr("app.routers.bookings.generate_qr_base64", lambda payload: PNG_DATA_URL)
    monkeypatch.setattr("app.routers.bookings.build_ticket_pdf", lambda booking, qr: b"%PDF-1.4")
    monkeypatch.setattr(
        "app.utils.email_service.send_ticket_email",
        lambda **kwargs: {"success": True, "configured": False, "message": "ok"},
    )
    monkeypatch.setattr("app.routers.bookings.create_wallet_pass", lambda booking: dict(WALLET_DATA))


def _booking_payload(**overrides):
    payload = {
        "trainId": "AVE-103",
        "travelDate": "2026-09-20",
        "passengers": [
            {
                "fullName": "Lucas Gomez",
                "passportId": "PAS-1",
                "seatId": "1-1B",
                "seatClass": "First",
                "price": 91.7,
            }
        ],
        "totalPrice": 91.7,
    }
    payload.update(overrides)
    return payload


class TestCreateBooking:
    def test_create_booking_success(self, client, collections, user_headers):
        response = client.post("/api/bookings", json=_booking_payload(), headers=user_headers)

        assert response.status_code == 201
        body = response.json()
        assert body["bookingCode"].startswith("RW-ES-")
        assert body["status"] == "confirmed"
        assert body["seats"] == ["1-1B"]
        assert body["qrCode"] == PNG_DATA_URL
        assert len(collections["bookings"].documents) == 2

    def test_create_booking_accepts_embedded_train(self, client, user_headers):
        payload = _booking_payload(trainId=None)
        payload["train"] = {
            "id": str(TRAIN_ID),
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
        }

        response = client.post("/api/bookings", json=payload, headers=user_headers)

        assert response.status_code == 201
        assert response.json()["trainId"] == str(TRAIN_ID)

    def test_create_booking_without_train_returns_400(self, client, user_headers):
        payload = _booking_payload()
        payload.pop("trainId")

        response = client.post("/api/bookings", json=payload, headers=user_headers)

        assert response.status_code == 400
        assert "trainId" in response.json()["detail"]

    def test_create_booking_unknown_train_returns_404(self, client, user_headers):
        response = client.post(
            "/api/bookings",
            json=_booking_payload(trainId="NO-EXISTE"),
            headers=user_headers,
        )

        assert response.status_code == 404

    def test_create_booking_seat_collision_returns_400(self, client, user_headers):
        response = client.post(
            "/api/bookings",
            json=_booking_payload(trainId=str(TRAIN_ID), travelDate="2026-09-20", passengers=[
                {
                    "fullName": "Otro",
                    "passportId": "PAS-2",
                    "seatId": "1-1A",
                    "seatClass": "standard",
                    "price": 50,
                }
            ]),
            headers=user_headers,
        )

        assert response.status_code == 400
        assert "ya han sido reservados" in response.json()["detail"]

    def test_create_booking_requires_authentication(self, client):
        response = client.post("/api/bookings", json=_booking_payload())
        assert response.status_code == 401


class TestReadBookings:
    def test_my_bookings_returns_own_bookings(self, client, user_headers):
        response = client.get("/api/bookings/my-bookings", headers=user_headers)

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["bookingCode"] == "RW-ES-9841"

    def test_my_bookings_empty_for_other_user(self, client, other_headers):
        response = client.get("/api/bookings/my-bookings", headers=other_headers)

        assert response.status_code == 200
        assert response.json() == []

    def test_get_booking_by_object_id(self, client, user_headers):
        response = client.get(f"/api/bookings/{BOOKING_ID}", headers=user_headers)

        assert response.status_code == 200
        assert response.json()["id"] == str(BOOKING_ID)

    def test_get_booking_by_code(self, client, user_headers):
        response = client.get("/api/bookings/RW-ES-9841", headers=user_headers)

        assert response.status_code == 200
        assert response.json()["bookingCode"] == "RW-ES-9841"

    def test_get_booking_forbidden_for_other_user(self, client, other_headers):
        response = client.get(f"/api/bookings/{BOOKING_ID}", headers=other_headers)

        assert response.status_code == 403

    def test_get_booking_allowed_for_admin(self, client, admin_headers):
        response = client.get(f"/api/bookings/{BOOKING_ID}", headers=admin_headers)

        assert response.status_code == 200

    def test_get_booking_not_found_returns_404(self, client, user_headers):
        response = client.get("/api/bookings/NO-EXISTE", headers=user_headers)

        assert response.status_code == 404


class TestCancelBooking:
    def test_cancel_booking_success(self, client, collections, user_headers):
        response = client.delete(f"/api/bookings/{BOOKING_ID}", headers=user_headers)

        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"
        assert collections["bookings"].documents[0]["status"] == "cancelled"
        assert "cancelledAt" in collections["bookings"].documents[0]

    def test_cancel_already_cancelled_is_idempotent(self, client, collections, user_headers):
        collections["bookings"].documents[0]["status"] = "cancelled"

        response = client.delete("/api/bookings/RW-ES-9841", headers=user_headers)

        assert response.status_code == 200
        assert "ya se encontraba cancelada" in response.json()["message"]

    def test_cancel_booking_forbidden_for_other_user(self, client, other_headers):
        response = client.delete(f"/api/bookings/{BOOKING_ID}", headers=other_headers)

        assert response.status_code == 403

    def test_cancel_booking_not_found_returns_404(self, client, user_headers):
        response = client.delete("/api/bookings/NO-EXISTE", headers=user_headers)

        assert response.status_code == 404


class TestBookingPdf:
    def test_download_pdf_returns_attachment(self, client, user_headers):
        response = client.get(f"/api/bookings/{BOOKING_ID}/pdf", headers=user_headers)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert response.content == b"%PDF-1.4"

    def test_download_pdf_forbidden_for_other_user(self, client, other_headers):
        response = client.get(f"/api/bookings/{BOOKING_ID}/pdf", headers=other_headers)

        assert response.status_code == 403

    def test_download_pdf_not_found_returns_404(self, client, user_headers):
        response = client.get("/api/bookings/NO-EXISTE/pdf", headers=user_headers)

        assert response.status_code == 404

    def test_download_pdf_generation_error_returns_500(self, client, monkeypatch, user_headers):
        def broken_pdf(booking, qr):
            raise RuntimeError("fpdf error")

        monkeypatch.setattr("app.routers.bookings.build_ticket_pdf", broken_pdf)

        response = client.get(f"/api/bookings/{BOOKING_ID}/pdf", headers=user_headers)

        assert response.status_code == 500
        assert "No se pudo generar el PDF" in response.json()["detail"]


class TestWalletEndpoints:
    def test_generate_wallet_for_booking_success(self, client, collections, user_headers):
        response = client.post(f"/api/bookings/{BOOKING_ID}/wallet", headers=user_headers)

        assert response.status_code == 200
        body = response.json()
        assert body["serialNumber"] == "SERIAL-1"
        assert body["googleSaveUrl"]
        assert collections["bookings"].documents[0]["walletSerial"] == "SERIAL-1"

    def test_generate_wallet_reuses_existing_pass(self, client, monkeypatch, collections, user_headers):
        collections["bookings"].documents[0].update({
            "walletSerial": "EXISTING",
            "walletGoogleSaveUrl": "https://wallet.example/existing",
            "walletShareUrl": "https://wallet.example/share",
            "walletApplePass": "",
            "walletFeaturedActionsIncluded": False,
        })

        def should_not_run(booking):
            raise AssertionError("create_wallet_pass no debe ejecutarse")

        monkeypatch.setattr("app.routers.bookings.create_wallet_pass", should_not_run)

        response = client.post(f"/api/bookings/{BOOKING_ID}/wallet", headers=user_headers)

        assert response.status_code == 200
        assert response.json()["serialNumber"] == "EXISTING"

    def test_generate_wallet_failure_returns_500(self, client, monkeypatch, user_headers):
        monkeypatch.setattr(
            "app.routers.bookings.create_wallet_pass",
            lambda booking: (_ for _ in ()).throw(RuntimeError("wallet caido")),
        )

        response = client.post(f"/api/bookings/{BOOKING_ID}/wallet", headers=user_headers)

        assert response.status_code == 500
        assert "No se pudo generar el pass" in response.json()["detail"]

    def test_generate_wallet_forbidden_for_other_user(self, client, other_headers):
        response = client.post(f"/api/bookings/{BOOKING_ID}/wallet", headers=other_headers)
        assert response.status_code == 403

    def test_generate_wallet_not_found_returns_404(self, client, user_headers):
        response = client.post("/api/bookings/NO-EXISTE/wallet", headers=user_headers)
        assert response.status_code == 404

    def test_generate_wallet_from_payload_success(self, client):
        response = client.post("/api/bookings/generate-wallet", json={
            "booking": {
                "bookingCode": "RW-ES-1",
                "userEmail": "destino@busyahu.com",
                "train": {"fromCity": "Madrid"},
                "passengers": [{"fullName": "Ana"}],
            },
            "platform": "apple",
            "originCity": "Madrid",
            "destinationCity": "Barcelona",
        })

        assert response.status_code == 200
        body = response.json()
        assert body["serialNumber"] == "SERIAL-1"
        assert body["featuredActionsIncluded"] is True

    def test_generate_wallet_from_empty_payload_returns_400(self, client):
        response = client.post("/api/bookings/generate-wallet", json={})
        assert response.status_code == 400

    def test_generate_wallet_without_recipient_returns_400(self, client):
        response = client.post("/api/bookings/generate-wallet", json={"booking": {"bookingCode": "X"}})
        assert response.status_code == 400
        assert "email" in response.json()["detail"]

    def test_generate_wallet_from_payload_failure_returns_500(self, client, monkeypatch):
        monkeypatch.setattr(
            "app.routers.bookings.create_wallet_pass",
            lambda booking: (_ for _ in ()).throw(RuntimeError("wallet caido")),
        )

        response = client.post("/api/bookings/generate-wallet", json={
            "booking": {"bookingCode": "X", "userEmail": "a@b.com"},
        })
        assert response.status_code == 500


class TestEmailAndPdfHelpers:
    def test_send_direct_email_success(self, client):
        response = client.post("/api/bookings/send-direct-email", json={
            "recipientEmail": "destino@busyahu.com",
            "booking": {
                "bookingCode": "RW-ES-2",
                "travelDate": "2026-09-20",
                "qrPayload": "PAYLOAD",
                "train": {"code": "AVE-103"},
                "passengers": [{"fullName": "Ana"}],
            },
        })

        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["qrCode"].startswith("data:image")

    def test_send_ticket_alias_works(self, client):
        response = client.post("/api/bookings/send-ticket", json={
            "to": "destino@busyahu.com",
            "booking": {"bookingCode": "RW-ES-2"},
        })
        assert response.status_code == 200

    def test_send_direct_email_pdf_failure_reports_error(self, client, monkeypatch):
        monkeypatch.setattr(
            "app.routers.bookings.build_ticket_pdf",
            lambda booking, qr: (_ for _ in ()).throw(RuntimeError("pdf roto")),
        )

        response = client.post("/api/bookings/send-direct-email", json={
            "recipientEmail": "destino@busyahu.com",
            "booking": {"bookingCode": "RW-ES-2"},
        })

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is False
        assert "No se pudo generar el PDF" in body["message"]

    def test_generate_pdf_from_data(self, client):
        response = client.post("/api/bookings/generate-pdf", json={
            "booking_code": "RW-ES-3",
            "travel_date": "2026-09-20",
            "total_price": 99,
            "qrCode": PNG_DATA_URL,
        })

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

    def test_generate_pdf_without_qr_uses_generated_code(self, client):
        response = client.post("/api/bookings/generate-pdf", json={
            "bookingCode": "RW-ES-4",
            "qrCode": "data:image/png;base64,!!!invalido",
        })

        assert response.status_code == 200

    def test_generate_pdf_empty_payload_returns_400(self, client):
        response = client.post("/api/bookings/generate-pdf", json={})
        assert response.status_code == 400

    def test_generate_pdf_failure_returns_500(self, client, monkeypatch):
        monkeypatch.setattr(
            "app.routers.bookings.build_ticket_pdf",
            lambda booking, qr: (_ for _ in ()).throw(RuntimeError("pdf roto")),
        )

        response = client.post("/api/bookings/generate-pdf", json={"bookingCode": "X"})
        assert response.status_code == 500

    def test_qr_endpoint_uses_payload_variants(self, client):
        response = client.post("/api/bookings/qr", json={"payload": "HOLA"})

        assert response.status_code == 200
        assert response.json()["qrCode"] == PNG_DATA_URL

    def test_qr_endpoint_defaults_to_brand(self, client):
        response = client.post("/api/bookings/qr", json={})
        assert response.status_code == 200
