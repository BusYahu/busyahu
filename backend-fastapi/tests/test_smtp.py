"""Tests unitarios de ``test_smtp.py`` sin red, sin SMTP y sin credenciales reales.

El script de diagnóstico se carga por ruta para no chocar con el módulo de test
y para verificar que importarlo no ejecuta ninguna acción ni termina el proceso.
"""
import importlib.util
import smtplib
from pathlib import Path

import pytest

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "test_smtp.py"


@pytest.fixture(scope="module")
def smtp_diag():
    spec = importlib.util.spec_from_file_location("smtp_diagnostic_script", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def config(smtp_diag):
    def build(**overrides):
        values = {
            "host": "smtp.test.local",
            "port": 587,
            "user": "remitente@test.local",
            "password": "abcd efgh ijkl mnop",
            "from_name": "BusYahu Test",
            "use_tls": True,
            "target_email": "destino@test.local",
        }
        values.update(overrides)
        return smtp_diag.SmtpConfig(**values)

    return build


class FakeSocket:
    def __init__(self, fail=False):
        self.fail = fail
        self.closed = False

    def close(self):
        self.closed = True


class FakeSmtpServer:
    def __init__(self, auth_error=None, send_error=None):
        self.auth_error = auth_error
        self.send_error = send_error
        self.started_tls = False
        self.logged_in = None
        self.sent = []
        self.quit_called = False

    def starttls(self):
        self.started_tls = True

    def login(self, user, password):
        if self.auth_error:
            raise self.auth_error
        self.logged_in = (user, password)

    def send_message(self, message):
        if self.send_error:
            raise self.send_error
        self.sent.append(message)

    def quit(self):
        self.quit_called = True


def test_importing_script_does_not_exit(smtp_diag):
    assert callable(smtp_diag.run_smtp_diagnostic)
    assert callable(smtp_diag.main)
    assert smtp_diag.TEST_CODE == "849201"


def test_load_smtp_config_reads_app_settings(smtp_diag, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.app.local", raising=False)
    monkeypatch.setattr(settings, "SMTP_PORT", 2525, raising=False)
    monkeypatch.setattr(settings, "SMTP_USER", "app@test.local", raising=False)
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "secreto", raising=False)
    monkeypatch.setattr(settings, "SMTP_FROM_NAME", "App", raising=False)
    monkeypatch.setattr(settings, "SMTP_USE_TLS", False, raising=False)

    result = smtp_diag.load_smtp_config("destino@test.local")

    assert result.host == "smtp.app.local"
    assert result.port == 2525
    assert result.user == "app@test.local"
    assert result.target_email == "destino@test.local"
    assert result.use_tls is False


def test_load_smtp_config_uses_user_as_default_target(smtp_diag):
    result = smtp_diag.load_smtp_config()
    assert result.target_email == result.user


def test_check_credentials_rejects_empty_or_placeholder(smtp_diag, config):
    assert smtp_diag._check_credentials(config(user="", password="")) is False
    assert smtp_diag._check_credentials(config(user="tu_correo@gmail.com")) is False
    assert smtp_diag._check_credentials(config(password="")) is False


def test_check_credentials_accepts_complete_config(smtp_diag, config):
    assert smtp_diag._check_credentials(config()) is True


def test_check_tcp_connection_success(smtp_diag, config, monkeypatch):
    sock = FakeSocket()
    monkeypatch.setattr(smtp_diag.socket, "create_connection", lambda *args, **kwargs: sock)

    assert smtp_diag._check_tcp_connection(config()) is True
    assert sock.closed is True


def test_check_tcp_connection_failure(smtp_diag, config, monkeypatch):
    def fail(*args, **kwargs):
        raise OSError("sin red")

    monkeypatch.setattr(smtp_diag.socket, "create_connection", fail)

    assert smtp_diag._check_tcp_connection(config()) is False


def test_connect_and_login_plain_with_tls(smtp_diag, config, monkeypatch):
    server = FakeSmtpServer()
    monkeypatch.setattr(smtp_diag.smtplib, "SMTP", lambda *args, **kwargs: server)

    result = smtp_diag._connect_and_login(config())

    assert result is server
    assert server.started_tls is True
    assert server.logged_in == ("remitente@test.local", "abcdefghijklmnop")


def test_connect_and_login_ssl_without_tls(smtp_diag, config, monkeypatch):
    server = FakeSmtpServer()
    monkeypatch.setattr(smtp_diag.smtplib, "SMTP_SSL", lambda *args, **kwargs: server)

    result = smtp_diag._connect_and_login(config(port=465, use_tls=False))

    assert result is server
    assert server.started_tls is False


def test_connect_and_login_propagates_authentication_error(smtp_diag, config, monkeypatch):
    error = smtplib.SMTPAuthenticationError(535, b"credenciales invalidas")
    server = FakeSmtpServer(auth_error=error)
    monkeypatch.setattr(smtp_diag.smtplib, "SMTP", lambda *args, **kwargs: server)

    with pytest.raises(smtplib.SMTPAuthenticationError):
        smtp_diag._connect_and_login(config())


def test_build_test_message_contains_code_and_recipient(smtp_diag, config):
    message = smtp_diag._build_test_message(config())

    assert smtp_diag.TEST_CODE in message["Subject"]
    assert message["To"] == "destino@test.local"
    assert "BusYahu" in message["From"]


def test_run_smtp_diagnostic_without_credentials(smtp_diag, config, monkeypatch):
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config(user="", password=""))
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)

    assert smtp_diag.run_smtp_diagnostic() == 1


def test_run_smtp_diagnostic_when_tcp_fails(smtp_diag, config, monkeypatch):
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config())
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)
    monkeypatch.setattr(smtp_diag, "_check_tcp_connection", lambda cfg: False)

    assert smtp_diag.run_smtp_diagnostic() == 1


def test_run_smtp_diagnostic_when_login_fails(smtp_diag, config, monkeypatch):
    error = smtplib.SMTPAuthenticationError(535, b"no autorizado")
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config())
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)
    monkeypatch.setattr(smtp_diag, "_check_tcp_connection", lambda cfg: True)

    def fail_login(cfg):
        raise error

    monkeypatch.setattr(smtp_diag, "_connect_and_login", fail_login)

    assert smtp_diag.run_smtp_diagnostic() == 1


def test_run_smtp_diagnostic_when_connection_raises(smtp_diag, config, monkeypatch):
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config())
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)
    monkeypatch.setattr(smtp_diag, "_check_tcp_connection", lambda cfg: True)

    def explode(cfg):
        raise ConnectionError("caido")

    monkeypatch.setattr(smtp_diag, "_connect_and_login", explode)

    assert smtp_diag.run_smtp_diagnostic() == 1


def test_run_smtp_diagnostic_without_target_email(smtp_diag, config, monkeypatch):
    server = FakeSmtpServer()
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config(target_email=""))
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)
    monkeypatch.setattr(smtp_diag, "_check_tcp_connection", lambda cfg: True)
    monkeypatch.setattr(smtp_diag, "_connect_and_login", lambda cfg: server)

    assert smtp_diag.run_smtp_diagnostic() == 0
    assert server.quit_called is True
    assert server.sent == []


def test_run_smtp_diagnostic_sends_message(smtp_diag, config, monkeypatch):
    server = FakeSmtpServer()
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config())
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)
    monkeypatch.setattr(smtp_diag, "_check_tcp_connection", lambda cfg: True)
    monkeypatch.setattr(smtp_diag, "_connect_and_login", lambda cfg: server)

    assert smtp_diag.run_smtp_diagnostic("destino@test.local") == 0
    assert len(server.sent) == 1
    assert server.quit_called is True


def test_run_smtp_diagnostic_handles_send_failure(smtp_diag, config, monkeypatch):
    server = FakeSmtpServer(send_error=RuntimeError("smtp caido"))
    monkeypatch.setattr(smtp_diag, "load_smtp_config", lambda target=None: config())
    monkeypatch.setattr(smtp_diag, "_log_config", lambda cfg: None)
    monkeypatch.setattr(smtp_diag, "_check_tcp_connection", lambda cfg: True)
    monkeypatch.setattr(smtp_diag, "_connect_and_login", lambda cfg: server)

    assert smtp_diag.run_smtp_diagnostic() == 1
    assert server.quit_called is True


def test_main_passes_target_and_returns_exit_code(smtp_diag, monkeypatch):
    received = {}

    def fake_run(target=None):
        received["target"] = target
        return 7

    monkeypatch.setattr(smtp_diag, "run_smtp_diagnostic", fake_run)

    assert smtp_diag.main(["test_smtp.py", "alguien@test.local"]) == 7
    assert received["target"] == "alguien@test.local"
