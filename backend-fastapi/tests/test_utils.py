import base64
import json
import smtplib
import socket
import sys
from types import SimpleNamespace
from urllib.error import HTTPError

import pytest

from app.config import settings
from app.utils import email_service, qr, ticket_pdf, wallet_service


class TestQr:
    def test_generate_qr_returns_png_data_url(self):
        result = qr.generate_qr_base64("HOLA MUNDO")

        assert result.startswith("data:image/png;base64,")
        assert base64.b64decode(result.split(",", 1)[1])

    def test_generate_qr_falls_back_when_qrcode_missing(self, monkeypatch):
        monkeypatch.setitem(sys.modules, "qrcode", None)

        result = qr.generate_qr_base64("HOLA")

        assert result.startswith("data:text/plain;base64,")
        assert base64.b64decode(result.split(",", 1)[1]) == b"HOLA"


class TestTicketPdf:
    def test_build_ticket_pdf_with_passengers_and_qr(self):
        qr_png = base64.b64decode(qr.generate_qr_base64("PAYLOAD").split(",", 1)[1])
        booking = {
            "bookingCode": "RW-ES-1",
            "travelDate": "2026-09-20",
            "status": "confirmed",
            "totalPrice": 99.5,
            "currency": "EUR",
            "train": {
                "code": "AVE-103",
                "fromCity": "Madrid",
                "fromStation": "Atocha",
                "toCity": "Barcelona",
                "toStation": "Sants",
                "departureTime": "08:30",
                "arrivalTime": "11:45",
                "duration": "3h 15m",
            },
            "passengers": [
                {
                    "fullName": "Lucas Gómez",
                    "passportId": "PAS-1",
                    "seatId": "1-1A",
                    "seatClass": "First",
                    "price": 99.5,
                }
            ],
            "qrPayload": "PAYLOAD",
        }

        result = ticket_pdf.build_ticket_pdf(booking, qr_png)

        assert result.startswith(b"%PDF")
        assert len(result) > 500

    def test_build_ticket_pdf_minimal_booking(self):
        result = ticket_pdf.build_ticket_pdf({}, None)

        assert result.startswith(b"%PDF")

    def test_clean_replaces_non_latin_characters(self):
        assert ticket_pdf._clean("日本語") == "???"


class FakeSmtpServer:
    instances = []

    def __init__(self, host, port, timeout=None):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.started_tls = False
        self.logged_in = None
        self.sent = []
        self.quit_called = False
        FakeSmtpServer.instances.append(self)

    def starttls(self):
        self.started_tls = True

    def login(self, user, password):
        self.logged_in = (user, password)

    def send_message(self, message):
        self.sent.append(message)

    def quit(self):
        self.quit_called = True


@pytest.fixture
def configured_smtp(monkeypatch):
    FakeSmtpServer.instances = []
    monkeypatch.setattr(settings, "SMTP_USER", "sender@busyahu.com")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "app password")
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USE_TLS", True)
    monkeypatch.setattr(settings, "SMTP_FROM_NAME", "BusYahu")
    monkeypatch.setattr(settings, "SMTP_FROM_EMAIL", "")
    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSmtpServer)
    monkeypatch.setattr(email_service.smtplib, "SMTP_SSL", FakeSmtpServer)
    return FakeSmtpServer


class TestEmailService:
    def test_is_smtp_configured_false_with_placeholders(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_USER", "tu_correo@gmail.com")
        monkeypatch.setattr(settings, "SMTP_PASSWORD", "tu_clave_de_aplicacion_de_16_letras")

        assert email_service.is_smtp_configured() is False

    def test_get_smtp_info_masks_user(self, configured_smtp):
        info = email_service.get_smtp_info()

        assert info["configured"] is True
        assert info["user"] == "se****@busyahu.com"
        assert info["has_password"] is True

    def test_get_smtp_info_masks_user_without_at(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_USER", "usuario")
        monkeypatch.setattr(settings, "SMTP_PASSWORD", "pass")
        assert email_service.get_smtp_info()["user"] == "us*****"

    def test_get_smtp_info_unconfigured(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_USER", "")
        monkeypatch.setattr(settings, "SMTP_PASSWORD", "")

        info = email_service.get_smtp_info()

        assert info["configured"] is False
        assert info["user"] == ""
        assert "SMTP no configurado" in info["message"]

    def test_send_verification_email_requires_recipient(self):
        result = email_service.send_verification_email("", "123456")

        assert result["success"] is False

    def test_send_verification_email_unconfigured_returns_code(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_USER", "")
        monkeypatch.setattr(settings, "SMTP_PASSWORD", "")

        result = email_service.send_verification_email("a@b.com", "123456", "Ana")

        assert result["success"] is True
        assert result["configured"] is False
        assert result["code"] == "123456"

    def test_send_verification_email_success(self, configured_smtp):
        result = email_service.send_verification_email("a@b.com", "123456", "Ana")

        assert result["success"] is True
        assert result["configured"] is True
        server = configured_smtp.instances[-1]
        assert server.started_tls is True
        assert server.logged_in == ("sender@busyahu.com", "apppassword")
        assert server.sent and server.quit_called is True

    def test_send_verification_email_ssl_port(self, configured_smtp, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_PORT", 465)

        result = email_service.send_verification_email("a@b.com", "123456")

        assert result["success"] is True
        assert configured_smtp.instances[-1].port == 465

    def test_send_verification_email_auth_error(self, configured_smtp, monkeypatch):
        def fail_login(self, user, password):
            raise smtplib.SMTPAuthenticationError(535, b"bad credentials")

        monkeypatch.setattr(configured_smtp, "login", fail_login)

        result = email_service.send_verification_email("a@b.com", "123456")

        assert result["success"] is False
        assert "autenticación" in result["error"]

    def test_send_verification_email_timeout(self, configured_smtp, monkeypatch):
        def fail_constructor(*args, **kwargs):
            raise socket.timeout("timeout")

        monkeypatch.setattr(email_service.smtplib, "SMTP", fail_constructor)

        result = email_service.send_verification_email("a@b.com", "123456")

        assert result["success"] is False
        assert "Timeout" in result["error"]

    def test_send_verification_email_generic_error(self, configured_smtp, monkeypatch):
        def fail_send(self, message):
            raise RuntimeError("smtp roto")

        monkeypatch.setattr(configured_smtp, "send_message", fail_send)

        result = email_service.send_verification_email("a@b.com", "123456")

        assert result["success"] is False
        assert "Error al enviar correo" in result["error"]

    def test_send_ticket_email_requires_recipient(self):
        result = email_service.send_ticket_email("", "Asunto", "texto", "<p>html</p>")

        assert result["success"] is False

    def test_send_ticket_email_unconfigured(self, monkeypatch):
        monkeypatch.setattr(settings, "SMTP_USER", "")
        monkeypatch.setattr(settings, "SMTP_PASSWORD", "")

        result = email_service.send_ticket_email("a@b.com", "Asunto", "texto", "<p>html</p>")

        assert result["success"] is True
        assert result["configured"] is False

    def test_send_ticket_email_with_attachments(self, configured_smtp):
        result = email_service.send_ticket_email(
            "a@b.com",
            "Asunto",
            "texto",
            "<p>html</p>",
            pdf_bytes=b"pdf",
            qr_png_bytes=b"png",
            wallet_bytes=b"wallet",
        )

        assert result["success"] is True
        server = configured_smtp.instances[-1]
        assert server.sent and server.quit_called is True

    def test_send_ticket_email_failure(self, configured_smtp, monkeypatch):
        def fail_send(self, message):
            raise RuntimeError("smtp roto")

        monkeypatch.setattr(configured_smtp, "send_message", fail_send)

        result = email_service.send_ticket_email("a@b.com", "Asunto", "texto", "html")

        assert result["success"] is False
        assert "Error al enviar billete" in result["error"]


class FakeUrlOpen:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = 0

    def __call__(self, request, timeout=None):
        self.calls += 1
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return SimpleNamespace(
            read=lambda: json.dumps(response).encode("utf-8"),
            __enter__=lambda self=None: SimpleNamespace(read=lambda: json.dumps(response).encode("utf-8")),
            __exit__=lambda *args: False,
        )


class UrlOpenContext:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return SimpleNamespace(read=lambda: json.dumps(self.payload).encode("utf-8"))

    def __exit__(self, *args):
        return False


class TestWalletService:
    def test_resolve_place_id_prefers_explicit_value(self):
        assert wallet_service._resolve_place_id({"applePlaceId": "EXPLICIT"}) == "EXPLICIT"

    def test_resolve_place_id_by_station(self):
        assert wallet_service._resolve_place_id({"originStationId": "ES-MAD"}).startswith("IAEA")

    def test_resolve_place_id_by_city(self):
        assert wallet_service._resolve_place_id({"fromCity": "Madrid"}).startswith("IAEA")

    def test_resolve_place_id_unknown_returns_empty(self):
        assert wallet_service._resolve_place_id({}) == ""

    def test_logo_data_uri_reads_asset(self):
        assert wallet_service._logo_data_uri().startswith("data:image/png;base64,")

    def test_create_wallet_pass_requires_api_key(self, monkeypatch):
        monkeypatch.setattr(settings, "WALLETWALLET_API_KEY", "")

        with pytest.raises(RuntimeError, match="no configurada"):
            wallet_service.create_wallet_pass({"bookingCode": "X"})

    def _payload(self):
        return {
            "serialNumber": "S1",
            "googleSaveUrl": "https://google",
            "applePass": "abc",
            "shareUrl": "https://share",
            "expirationDate": "2026-01-01",
        }

    def test_create_wallet_pass_success(self, monkeypatch):
        monkeypatch.setattr(settings, "WALLETWALLET_API_KEY", "key")
        payload = self._payload()
        monkeypatch.setattr(
            wallet_service.urllib.request, "urlopen", lambda request, timeout=None: UrlOpenContext(payload)
        )

        result = wallet_service.create_wallet_pass({
            "bookingCode": "RW-1",
            "travelDate": "2026-09-20",
            "train": {"fromCity": "Madrid", "toCity": "Barcelona"},
            "passengers": [{"fullName": "Ana", "seatId": "1-1A"}],
        })

        assert result["serialNumber"] == "S1"
        assert result["featuredActionsIncluded"] is True

    def test_create_wallet_pass_retries_without_featured_actions(self, monkeypatch):
        monkeypatch.setattr(settings, "WALLETWALLET_API_KEY", "key")
        calls = []

        def urlopen(request, timeout=None):
            calls.append(json.loads(request.data.decode("utf-8")))
            if len(calls) == 1:
                error = HTTPError("https://api", 400, "bad", {}, None)
                error.read = lambda: b"featured actions rejected"
                raise error
            return UrlOpenContext(self._payload())

        monkeypatch.setattr(wallet_service.urllib.request, "urlopen", urlopen)

        result = wallet_service.create_wallet_pass({
            "bookingCode": "RW-1",
            "train": {"fromCity": "Madrid", "toCity": "Barcelona"},
        })

        assert result["serialNumber"] == "S1"
        assert "featuredActions" not in calls[1]

    def test_create_wallet_pass_http_error_without_retry(self, monkeypatch):
        monkeypatch.setattr(settings, "WALLETWALLET_API_KEY", "key")

        def urlopen(request, timeout=None):
            error = HTTPError("https://api", 500, "server", {}, None)
            error.read = lambda: b"boom"
            raise error

        monkeypatch.setattr(wallet_service.urllib.request, "urlopen", urlopen)

        with pytest.raises(RuntimeError, match="WalletWallet error 500"):
            wallet_service.create_wallet_pass({"bookingCode": "RW-1"})

    def test_create_wallet_pass_generic_error(self, monkeypatch):
        monkeypatch.setattr(settings, "WALLETWALLET_API_KEY", "key")

        def urlopen(request, timeout=None):
            raise OSError("sin red")

        monkeypatch.setattr(wallet_service.urllib.request, "urlopen", urlopen)

        with pytest.raises(RuntimeError, match="Error generando pass"):
            wallet_service.create_wallet_pass({"bookingCode": "RW-1"})


class TestSmtpDiagnosticScript:
    def _config(self, **overrides):
        import test_smtp

        values = dict(
            host="smtp.test",
            port=587,
            user="user@test.com",
            password="secret",
            from_name="BusYahu",
            use_tls=True,
            target_email="destino@test.com",
        )
        values.update(overrides)
        return test_smtp.SmtpConfig(**values)

    def test_import_does_not_exit_or_connect(self):
        import test_smtp

        assert callable(test_smtp.run_smtp_diagnostic)

    def test_load_config_from_environment_when_app_unavailable(self, monkeypatch):
        import test_smtp

        monkeypatch.setitem(sys.modules, "app.config", None)
        monkeypatch.setenv("SMTP_USER", "env@test.com")
        monkeypatch.setenv("SMTP_PASSWORD", "envpass")
        monkeypatch.setenv("SMTP_HOST", "envhost")
        monkeypatch.setenv("SMTP_PORT", "2525")

        config = test_smtp.load_smtp_config("destino@test.com")

        assert config.user == "env@test.com"
        assert config.password == "envpass"
        assert config.host == "envhost"
        assert config.port == 2525
        assert config.target_email == "destino@test.com"

    def test_missing_credentials_returns_1(self, monkeypatch):
        import test_smtp

        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config(user=""))

        assert test_smtp.run_smtp_diagnostic() == 1

    def test_tcp_failure_returns_1(self, monkeypatch):
        import test_smtp

        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config())

        def fail(*args, **kwargs):
            raise OSError("no network")

        monkeypatch.setattr(test_smtp.socket, "create_connection", fail)

        assert test_smtp.run_smtp_diagnostic() == 1

    def test_auth_failure_returns_1(self, monkeypatch):
        import test_smtp

        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config())
        monkeypatch.setattr(test_smtp.socket, "create_connection", lambda *a, **k: SimpleNamespace(close=lambda: None))

        class AuthFailServer(FakeSmtpServer):
            def login(self, user, password):
                raise smtplib.SMTPAuthenticationError(535, b"bad")

        monkeypatch.setattr(test_smtp.smtplib, "SMTP", AuthFailServer)

        assert test_smtp.run_smtp_diagnostic() == 1

    def test_generic_connection_failure_returns_1(self, monkeypatch):
        import test_smtp

        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config())
        monkeypatch.setattr(test_smtp.socket, "create_connection", lambda *a, **k: SimpleNamespace(close=lambda: None))

        def fail(*args, **kwargs):
            raise RuntimeError("boom")

        monkeypatch.setattr(test_smtp.smtplib, "SMTP", fail)

        assert test_smtp.run_smtp_diagnostic() == 1

    def test_no_target_email_returns_0(self, monkeypatch):
        import test_smtp

        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config(target_email=""))
        monkeypatch.setattr(test_smtp.socket, "create_connection", lambda *a, **k: SimpleNamespace(close=lambda: None))
        monkeypatch.setattr(test_smtp.smtplib, "SMTP", FakeSmtpServer)

        assert test_smtp.run_smtp_diagnostic() == 0
        assert FakeSmtpServer.instances[-1].quit_called is True

    def test_send_success_returns_0(self, monkeypatch):
        import test_smtp

        FakeSmtpServer.instances = []
        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config())
        monkeypatch.setattr(test_smtp.socket, "create_connection", lambda *a, **k: SimpleNamespace(close=lambda: None))
        monkeypatch.setattr(test_smtp.smtplib, "SMTP", FakeSmtpServer)

        assert test_smtp.run_smtp_diagnostic() == 0
        server = FakeSmtpServer.instances[-1]
        assert server.sent
        assert server.quit_called is True

    def test_send_failure_returns_1(self, monkeypatch):
        import test_smtp

        class SendFailServer(FakeSmtpServer):
            def send_message(self, message):
                raise RuntimeError("smtp roto")

        monkeypatch.setattr(test_smtp, "load_smtp_config", lambda target=None: self._config())
        monkeypatch.setattr(test_smtp.socket, "create_connection", lambda *a, **k: SimpleNamespace(close=lambda: None))
        monkeypatch.setattr(test_smtp.smtplib, "SMTP", SendFailServer)

        assert test_smtp.run_smtp_diagnostic() == 1

    def test_main_returns_exit_code(self, monkeypatch):
        import test_smtp

        monkeypatch.setattr(test_smtp, "run_smtp_diagnostic", lambda target=None: 0)

        assert test_smtp.main(["test_smtp.py", "destino@test.com"]) == 0
