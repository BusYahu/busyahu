#!/usr/bin/env python3
"""
Script de diagnóstico y prueba para el servicio de envío de correos (SMTP / Gmail).

Uso en local o dentro del contenedor Docker:
  python test_smtp.py [correo_destino@ejemplo.com]
o con Docker Compose:
  docker compose exec backend-fastapi python test_smtp.py [tu_correo@ejemplo.com]

Importar este módulo no ejecuta ninguna acción de red ni termina el proceso:
la lógica vive en ``run_smtp_diagnostic`` y sólo se invoca desde ``main``.
"""

import logging
import os
import smtplib
import socket
import sys
from dataclasses import dataclass
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger("busyahu.smtp_diagnostic")

PLACEHOLDER_USERS = {"", "tu_correo@gmail.com"}
TEST_CODE = "849201"


@dataclass
class SmtpConfig:
    host: str
    port: int
    user: str
    password: str
    from_name: str
    use_tls: bool
    target_email: str


def load_smtp_config(target_email: Optional[str] = None) -> SmtpConfig:
    """Carga la configuración SMTP desde la app o desde variables de entorno."""
    try:
        from app.config import settings

        host = settings.SMTP_HOST
        port = settings.SMTP_PORT
        user = settings.SMTP_USER
        password = settings.SMTP_PASSWORD
        from_name = settings.SMTP_FROM_NAME
        use_tls = settings.SMTP_USE_TLS
    except Exception:  # pragma: no cover - sólo si la app no está instalada
        host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        port = int(os.getenv("SMTP_PORT", "587"))
        user = os.getenv("SMTP_USER", os.getenv("EMAIL_USER", "")).strip()
        password = os.getenv(
            "SMTP_PASSWORD",
            os.getenv("SMTP_PASS", os.getenv("EMAIL_APP_PASSWORD", os.getenv("EMAIL_PASS", ""))),
        ).strip()
        if not user or not password:
            try:
                from app.secrets import get_smtp_credentials

                fallback_user, fallback_password = get_smtp_credentials()
                user = user or fallback_user
                password = password or fallback_password
            except Exception:
                pass
        from_name = os.getenv("SMTP_FROM_NAME", "BusYahu Rail")
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    target = target_email if target_email is not None else (user or "")
    return SmtpConfig(
        host=host,
        port=port,
        user=user,
        password=password,
        from_name=from_name,
        use_tls=use_tls,
        target_email=target,
    )


def _log_config(config: SmtpConfig) -> None:
    logger.info("=" * 65)
    logger.info("DIAGNÓSTICO DE CONFIGURACIÓN SMTP (BusYahu Rail)")
    logger.info("=" * 65)
    logger.info("Host SMTP      : %s", config.host)
    logger.info("Puerto SMTP    : %s", config.port)
    logger.info("Usuario SMTP   : %s", config.user if config.user else "[NO CONFIGURADO]")
    logger.info(
        "Password SMTP  : %s",
        "*" * len(config.password) if config.password else "[NO CONFIGURADO]",
    )
    logger.info("Use TLS        : %s", config.use_tls)
    logger.info(
        "Destinatario   : %s",
        config.target_email if config.target_email else "[NO INDICADO]",
    )
    logger.info("-" * 65)


def _check_credentials(config: SmtpConfig) -> bool:
    if not config.user or not config.password or config.user in PLACEHOLDER_USERS:
        logger.error("Credenciales SMTP incompletas o usando valores por defecto.")
        logger.error(
            "Definí SMTP_USER y SMTP_PASSWORD (contraseña de aplicación de 16 letras) "
            "en tu archivo .env."
        )
        return False
    return True


def _check_tcp_connection(config: SmtpConfig) -> bool:
    logger.info("1. Probando resolución DNS y conexión TCP al servidor...")
    try:
        sock = socket.create_connection((config.host, config.port), timeout=10)
        sock.close()
        logger.info("   Conexión TCP exitosa a %s:%s", config.host, config.port)
        return True
    except OSError as exc:
        logger.error("   Error de conexión de red hacia %s:%s: %s", config.host, config.port, exc)
        logger.error("   Revisá firewall, DNS y que el puerto no esté bloqueado por el ISP.")
        return False


def _connect_and_login(config: SmtpConfig):
    logger.info("2. Conectando al protocolo SMTP y autenticando credenciales...")
    clean_password = config.password.replace(" ", "")

    if config.port == 465:
        server = smtplib.SMTP_SSL(config.host, config.port, timeout=15)
        logger.info("   Conexión SSL establecida en puerto 465.")
    else:
        server = smtplib.SMTP(config.host, config.port, timeout=15)
        logger.info("   Conexión inicial SMTP establecida en puerto %s.", config.port)
        if config.use_tls:
            server.starttls()
            logger.info("   Negociación STARTTLS completada.")

    try:
        server.login(config.user, clean_password)
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error("   Error de autenticación SMTP (535): %s", auth_err)
        logger.error(
            "   Para Gmail usá una contraseña de aplicación de 16 caracteres "
            "(https://myaccount.google.com/apppasswords)."
        )
        raise
    logger.info("   Autenticación exitosa para el usuario: %s", config.user)
    return server


def _build_test_message(config: SmtpConfig) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Prueba Exitosa de Correo - BusYahu Rail ({TEST_CODE})"
    msg["From"] = f'"{config.from_name}" <{config.user}>'
    msg["To"] = config.target_email

    html = f"""
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #4f46e5; margin-top: 0;">BusYahu Rail - Correo de Prueba</h2>
        <p>¡Tu configuración de SMTP y correo electrónico está funcionando <strong>100% correctamente</strong>!</p>
        <div style="background: #eef2ff; border: 2px dashed #6366f1; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #3730a3; font-family: monospace;">{TEST_CODE}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">Prueba ejecutada desde test_smtp.py en el backend de BusYahu.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def run_smtp_diagnostic(target_email: Optional[str] = None) -> int:
    """Ejecuta el diagnóstico completo. Devuelve el código de salida (0 = éxito)."""
    config = load_smtp_config(target_email)
    _log_config(config)

    if not _check_credentials(config):
        return 1
    if not _check_tcp_connection(config):
        return 1

    try:
        server = _connect_and_login(config)
    except smtplib.SMTPAuthenticationError:
        return 1
    except Exception as exc:
        logger.error("   Error al conectar/autenticar con el servidor SMTP: %s", exc)
        return 1

    if not config.target_email:
        logger.warning("No se especificó correo destinatario para enviar un mensaje de prueba.")
        logger.warning("Pasá tu correo como argumento: python test_smtp.py tu_correo@gmail.com")
        server.quit()
        return 0

    logger.info("3. Enviando mensaje de prueba a '%s'...", config.target_email)
    try:
        server.send_message(_build_test_message(config))
        server.quit()
        logger.info("   Correo enviado con éxito. Revisá la bandeja de entrada o Spam.")
        return 0
    except Exception as exc:
        logger.error("   Error al despachar el correo electrónico: %s", exc)
        try:
            server.quit()
        except Exception:
            pass
        return 1


def main(argv: Optional[list] = None) -> int:
    argv = sys.argv if argv is None else argv
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    target = argv[1] if len(argv) > 1 else None
    return run_smtp_diagnostic(target)


if __name__ == "__main__":
    raise SystemExit(main())
