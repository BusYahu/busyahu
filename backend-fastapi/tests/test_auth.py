from datetime import datetime, timedelta

import pytest


class TestRegisterRequest:
    def test_register_request_creates_pending_code(self, client, collections, default_email):
        response = client.post("/api/auth/register-request", json={
            "email": "nuevo@busyahu.com",
            "password": "Segura123!",
            "firstName": "Nuevo",
            "lastName": "Viajero",
            "dni": "12345678",
        })

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["email"] == "nuevo@busyahu.com"
        assert body["debugCode"]
        assert collections["pending_verifications"].documents[0]["code"] == body["debugCode"]

    def test_register_request_builds_name_from_parts(self, client, collections, default_email):
        response = client.post("/api/auth/register-request", json={
            "email": "partes@busyahu.com",
            "password": "Segura123!",
            "firstName": "Ana",
            "lastName": "Perez",
        })

        assert response.status_code == 200
        pending = collections["pending_verifications"].documents[0]
        assert pending["name"] == "Ana Perez"
        assert pending["firstName"] == "Ana"

    def test_register_request_rejects_duplicate_email(self, client, default_email):
        response = client.post("/api/auth/register-request", json={
            "email": "pasajero@busyahu.com",
            "password": "Segura123!",
        })

        assert response.status_code == 400
        assert "ya se encuentra registrado" in response.json()["detail"]

    def test_register_request_database_error_returns_500(self, client, collections, monkeypatch, default_email):
        async def broken_find_one(query):
            raise RuntimeError("mongo caido")

        monkeypatch.setattr(collections["users"], "find_one", broken_find_one)

        response = client.post("/api/auth/register-request", json={
            "email": "error@busyahu.com",
            "password": "Segura123!",
        })

        assert response.status_code == 500
        assert "Error de base de datos" in response.json()["detail"]

    def test_register_request_email_failure_returns_500(self, client, monkeypatch, default_email):
        monkeypatch.setattr(
            "app.routers.auth.send_verification_email",
            lambda *args, **kwargs: {"success": False, "message": "SMTP caido"},
        )

        response = client.post("/api/auth/register-request", json={
            "email": "sinmail@busyahu.com",
            "password": "Segura123!",
        })

        assert response.status_code == 500
        assert "No se pudo enviar" in response.json()["detail"]

    def test_register_alias_delegates_to_register_request(self, client, collections, default_email):
        response = client.post("/api/auth/register", json={
            "email": "alias@busyahu.com",
            "password": "Segura123!",
        })

        assert response.status_code == 200
        assert collections["pending_verifications"].documents[0]["email"] == "alias@busyahu.com"


class TestVerifyCode:
    def _pending(self, email="verificar@busyahu.com", code="123456", delta_minutes=5):
        return {
            "email": email,
            "code": code,
            "firstName": "Veri",
            "lastName": "Ficar",
            "name": "Veri Ficar",
            "dni": "111",
            "passwordHash": "hash",
            "role": "client",
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow() + timedelta(minutes=delta_minutes),
        }

    def test_verify_code_creates_user_and_returns_token(self, client, collections):
        collections["pending_verifications"].documents.append(self._pending())

        response = client.post("/api/auth/verify-code", json={
            "email": "verificar@busyahu.com",
            "code": "123456",
        })

        assert response.status_code == 201
        body = response.json()
        assert body["email"] == "verificar@busyahu.com"
        assert body["token"]
        assert body["access_token"] == body["token"]
        assert collections["pending_verifications"].documents == []
        assert any(user["email"] == "verificar@busyahu.com" for user in collections["users"].documents)

    def test_verify_code_missing_pending_returns_404(self, client):
        response = client.post("/api/auth/verify-code", json={
            "email": "nada@busyahu.com",
            "code": "123456",
        })

        assert response.status_code == 404

    def test_verify_code_expired_deletes_pending_and_returns_400(self, client, collections):
        collections["pending_verifications"].documents.append(self._pending(delta_minutes=-5))

        response = client.post("/api/auth/verify-code", json={
            "email": "verificar@busyahu.com",
            "code": "123456",
        })

        assert response.status_code == 400
        assert "expirado" in response.json()["detail"]
        assert collections["pending_verifications"].documents == []

    def test_verify_code_without_expiration_returns_400(self, client, collections):
        pending = self._pending()
        pending.pop("expiresAt")
        collections["pending_verifications"].documents.append(pending)

        response = client.post("/api/auth/verify-code", json={
            "email": "verificar@busyahu.com",
            "code": "123456",
        })

        assert response.status_code == 400

    def test_verify_code_wrong_code_returns_400(self, client, collections):
        collections["pending_verifications"].documents.append(self._pending())

        response = client.post("/api/auth/verify-code", json={
            "email": "verificar@busyahu.com",
            "code": "999999",
        })

        assert response.status_code == 400
        assert "incorrecto" in response.json()["detail"]


class TestResendCode:
    def test_resend_code_updates_pending(self, client, collections, default_email):
        collections["pending_verifications"].documents.append({
            "email": "reenviar@busyahu.com",
            "code": "111111",
            "firstName": "Re",
            "expiresAt": datetime.utcnow() + timedelta(minutes=1),
        })

        response = client.post("/api/auth/resend-code", json={"email": "reenviar@busyahu.com"})

        assert response.status_code == 200
        assert response.json()["debugCode"]
        assert collections["pending_verifications"].documents[0]["code"] == response.json()["debugCode"]

    def test_resend_code_missing_pending_returns_404(self, client, default_email):
        response = client.post("/api/auth/resend-code", json={"email": "nada@busyahu.com"})
        assert response.status_code == 404

    def test_resend_code_email_failure_returns_500(self, client, collections, monkeypatch, default_email):
        collections["pending_verifications"].documents.append({
            "email": "reenviar@busyahu.com",
            "code": "111111",
            "firstName": "Re",
            "expiresAt": datetime.utcnow() + timedelta(minutes=1),
        })
        monkeypatch.setattr(
            "app.routers.auth.send_verification_email",
            lambda *args, **kwargs: {"success": False, "error": "SMTP caido"},
        )

        response = client.post("/api/auth/resend-code", json={"email": "reenviar@busyahu.com"})
        assert response.status_code == 500


class TestLoginAndProfile:
    def test_login_success_returns_token(self, client):
        response = client.post("/api/auth/login", json={
            "email": "pasajero@busyahu.com",
            "password": "Segura123!",
        })

        assert response.status_code == 200
        body = response.json()
        assert body["id"]
        assert body["token"]
        assert body["role"] == "client"

    def test_login_wrong_password_returns_401(self, client):
        response = client.post("/api/auth/login", json={
            "email": "pasajero@busyahu.com",
            "password": "incorrecta",
        })
        assert response.status_code == 401

    def test_login_unknown_email_returns_401(self, client):
        response = client.post("/api/auth/login", json={
            "email": "fantasma@busyahu.com",
            "password": "Segura123!",
        })
        assert response.status_code == 401

    def test_me_returns_current_user(self, client, user_headers):
        response = client.get("/api/auth/me", headers=user_headers)

        assert response.status_code == 200
        body = response.json()
        assert body["email"] == "pasajero@busyahu.com"
        assert body["role"] == "client"

    def test_me_with_invalid_token_returns_401(self, client):
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer token-invalido"})
        assert response.status_code == 401

    def test_me_without_token_returns_401(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_me_with_unknown_user_returns_401(self, client):
        from tests.conftest import make_token

        token = make_token("64a1e2d3c4b5a6f7e8d9c0ff", "nadie@busyahu.com", "client")
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_smtp_status_endpoint(self, client, default_email):
        response = client.get("/api/auth/smtp-status")
        assert response.status_code == 200
        assert response.json()["configured"] is False

    def test_test_email_endpoint(self, client, default_email):
        response = client.post("/api/auth/test-email", json={"email": "prueba@busyahu.com"})
        assert response.status_code == 200
        body = response.json()
        assert body["recipient"] == "prueba@busyahu.com"
        assert body["testCode"]
