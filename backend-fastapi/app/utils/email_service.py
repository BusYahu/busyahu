"""
Servicio de correo electrónico para BusYahu (FastAPI).

Encapsula el envío de correos (código de verificación de registro) vía SMTP,
usando la configuración definida en `app.config.settings` (variables de entorno
SMTP_*). Se inspira en el flujo validado por `test_smtp.py`.

Las funciones son sincrónicas porque el router de autenticación las invoca de
forma sincrónica (ver `app.routers.auth`).
"""
import logging
import os
import smtplib
import socket
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)

# Valores por defecto/placeholder que no deben considerarse configuración válida
_PLACEHOLDER_USERS = {"", "tu_correo@gmail.com", "your_email@gmail.com"}
_PLACEHOLDER_PASSWORDS = {"", "tu_clave_de_aplicacion_de_16_letras", "your_app_password"}


def _smtp_user() -> str:
    return (settings.SMTP_USER or os.getenv("EMAIL_USER", "")).strip()


def _smtp_password() -> str:
    raw = settings.SMTP_PASSWORD or ""
    # Fallback por si la clase no lo expusiera (no debería ocurrir)
    if not raw:
        raw = os.getenv(
            "SMTP_PASSWORD",
            os.getenv("SMTP_PASS", os.getenv("EMAIL_APP_PASSWORD", os.getenv("EMAIL_PASS", ""))),
        )
    return (raw or "").strip()


def _clean_password(pwd: str) -> str:
    return (pwd or "").replace(" ", "").replace("\t", "")


def is_smtp_configured() -> bool:
    """Indica si existen credenciales SMTP (no vacías ni placeholder)."""
    user = _smtp_user()
    pwd = _clean_password(_smtp_password())
    if not user or user in _PLACEHOLDER_USERS:
        return False
    if not pwd or pwd in _PLACEHOLDER_PASSWORDS:
        return False
    return True


def get_smtp_info() -> dict:
    """Devuelve información (no sensible) del estado de configuración SMTP."""
    user = _smtp_user()
    pwd = _clean_password(_smtp_password())
    configured = is_smtp_configured()
    masked_user = ""
    if user:
        if "@" in user:
            local, domain = user.split("@", 1)
            local_masked = local[:2] + "*" * max(0, len(local) - 2)
            masked_user = f"{local_masked}@{domain}"
        else:
            masked_user = user[:2] + "*" * max(0, len(user) - 2)

    if configured:
        message = "SMTP configurado correctamente."
    else:
        message = (
            "SMTP no configurado. Define SMTP_USER y SMTP_PASSWORD "
            "(contraseña de aplicación) en el archivo .env."
        )

    return {
        "configured": configured,
        "success": configured,
        "message": message,
        "host": settings.SMTP_HOST,
        "port": settings.SMTP_PORT,
        "use_tls": settings.SMTP_USE_TLS,
        "user": masked_user,
        "has_password": bool(pwd),
    }


def _build_email_html(code: str, first_name: str) -> str:
    return f"""
    <div style="font-family: 'Segoe UI', sans-serif; background: #f1f5f9; padding: 32px 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px;
                  border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.06);">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 24px 32px; color: #fff;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: -0.02em;">🚆 BusYahu Rail</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Verificación de cuenta</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #0f172a; margin: 0 0 16px 0;">
            Hola <strong>{first_name}</strong>,
          </p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
            Gracias por crear tu cuenta en BusYahu. Para completar el registro, ingresá el siguiente
            código de verificación en la aplicación. <strong>El código vence en 10 minutos.</strong>
          </p>
          <div style="background: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px;
                      padding: 20px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3730a3;
                         font-family: 'Courier New', monospace;">{code}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
            Si no solicitaste este registro, puedes ignorar este correo de forma segura.
          </p>
        </div>
        <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;
                    font-size: 12px; color: #94a3b8; text-align: center;">
          BusYahu Rail &copy; {datetime.utcnow().year}
        </div>
      </div>
    </div>
    """


def send_verification_email(recipient: str, code: str, first_name: str = "Viajero") -> dict:
    """
    Envía el correo con el código de verificación de 6 dígitos.

    Retorna un diccionario con al menos:
      - success: bool
      - configured: bool
      - error / message: str (en caso de falla / info)
    """
    recipient = (recipient or "").strip()
    first_name = (first_name or "Viajero").strip() or "Viajero"
    code = (code or "").strip()

    if not recipient:
        return {"success": False, "configured": is_smtp_configured(), "error": "Destinatario vacío."}

    if not is_smtp_configured():
        # Modo desarrollo: no se envía correo real, pero se devuelve el código
        # para poder verificar la cuenta sin SMTP (útil en local).
        logger.warning(
            "SMTP no configurado: se omite el envío real de correo para %s. "
            "Se devuelve el código para pruebas locales.", recipient
        )
        return {
            "success": True,
            "configured": False,
            "message": "SMTP no configurado. Código devuelto para pruebas locales.",
            "code": code,
        }

    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = _smtp_user()
    smtp_password = _clean_password(_smtp_password())
    smtp_from_name = settings.SMTP_FROM_NAME or "BusYahu Rail"
    use_tls = settings.SMTP_USE_TLS

    from_email = settings.SMTP_FROM_EMAIL.strip() if getattr(settings, "SMTP_FROM_EMAIL", "") else ""
    if not from_email:
        from_email = smtp_user

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🔐 Tu código de verificación BusYahu: {code}"
    msg["From"] = f'"{smtp_from_name}" <{from_email}>'
    msg["To"] = recipient

    text_part = MIMEText(
        f"Hola {first_name},\n\n"
        f"Tu código de verificación de BusYahu es: {code}\n"
        f"Vence en 10 minutos.\n\n"
        f"Si no solicitaste este registro, ignora este correo.\n",
        "plain",
        "utf-8",
    )
    html_part = MIMEText(_build_email_html(code, first_name), "html", "utf-8")
    msg.attach(text_part)
    msg.attach(html_part)

    server = None
    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if use_tls:
                server.starttls()

        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        logger.info("Correo de verificación enviado exitosamente a %s", recipient)
        return {
            "success": True,
            "configured": True,
            "message": "Correo enviado exitosamente.",
        }
    except smtplib.SMTPAuthenticationError as auth_err:
        err = f"Error de autenticación SMTP: {auth_err}"
        logger.error(err)
        return {"success": False, "configured": True, "error": err, "message": err}
    except (socket.timeout, TimeoutError) as to_err:
        err = f"Timeout conectando al servidor SMTP: {to_err}"
        logger.error(err)
        return {"success": False, "configured": True, "error": err, "message": err}
    except Exception as e:
        err = f"Error al enviar correo: {e}"
        logger.exception(err)
        return {"success": False, "configured": True, "error": err, "message": err}
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass


def send_ticket_email(
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str,
    pdf_bytes: bytes = None,
    pdf_filename: str = "comprobante_busyahu.pdf",
    qr_png_bytes: bytes = None,
    wallet_bytes: bytes = None,
    wallet_filename: str = "pasaje_wallet.pkpass",
) -> dict:
    """Envía el billete/PDF de reserva por correo, adjuntando el PDF con QR."""
    recipient = (recipient or "").strip()
    if not recipient:
        return {"success": False, "configured": is_smtp_configured(), "error": "Destinatario vacio."}

    if not is_smtp_configured():
        logger.warning("SMTP no configurado: se omite envio de billete a %s", recipient)
        return {
            "success": True,
            "configured": False,
            "message": "SMTP no configurado. Billete listo para descarga local.",
        }

    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = _smtp_user()
    smtp_password = _clean_password(_smtp_password())
    smtp_from_name = settings.SMTP_FROM_NAME or "BusYahu Rail"
    use_tls = settings.SMTP_USE_TLS

    from_email = (settings.SMTP_FROM_EMAIL or "").strip() or smtp_user

    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject or "Tu billete BusYahu"
    msg["From"] = f'"{smtp_from_name}" <{from_email}>'
    msg["To"] = recipient

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text_body or "", "plain", "utf-8"))
    alt.attach(MIMEText(html_body or "", "html", "utf-8"))
    msg.attach(alt)

    if pdf_bytes:
        part = MIMEBase("application", "pdf")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename=pdf_filename)
        msg.attach(part)

    if qr_png_bytes:
        qr_part = MIMEBase("image", "png")
        qr_part.set_payload(qr_png_bytes)
        encoders.encode_base64(qr_part)
        qr_part.add_header("Content-ID", "<qrimage>")
        qr_part.add_header("Content-Disposition", "inline", filename="qr_acceso.png")
        msg.attach(qr_part)

    if wallet_bytes:
        w_part = MIMEBase("application", "octet-stream")
        w_part.set_payload(wallet_bytes)
        encoders.encode_base64(w_part)
        w_part.add_header("Content-Disposition", "attachment", filename=wallet_filename)
        msg.attach(w_part)

    server = None
    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if use_tls:
                server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        logger.info("Billete enviado exitosamente a %s", recipient)
        return {"success": True, "configured": True, "message": "Billete enviado exitosamente."}
    except Exception as e:
        err = f"Error al enviar billete: {e}"
        logger.exception(err)
        return {"success": False, "configured": True, "error": err, "message": err}
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass
