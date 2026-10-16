#!/usr/bin/env python3
"""
Script de diagnóstico y prueba para el servicio de envío de correos (SMTP / Gmail).
Uso en local o dentro del contenedor Docker:
  python test_smtp.py [correo_destino@ejemplo.com]
o con Docker Compose:
  docker compose exec backend-fastapi python test_smtp.py [tu_correo@ejemplo.com]
"""

import sys
import os
import socket
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Intentamos importar la configuración de la app
try:
    from app.config import settings
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    smtp_from_name = settings.SMTP_FROM_NAME
    smtp_use_tls = settings.SMTP_USE_TLS
except Exception:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", os.getenv("EMAIL_USER", "")).strip()
    smtp_password = os.getenv("SMTP_PASSWORD", os.getenv("SMTP_PASS", os.getenv("EMAIL_APP_PASSWORD", os.getenv("EMAIL_PASS", "")))).strip()
    smtp_from_name = os.getenv("SMTP_FROM_NAME", "BusYahu Rail")
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

target_email = sys.argv[1] if len(sys.argv) > 1 else smtp_user

print("=" * 65)
print("🚆 DIAGNÓSTICO DE CONFIGURACIÓN SMTP (BusYahu Rail)")
print("=" * 65)
print(f"Host SMTP      : {smtp_host}")
print(f"Puerto SMTP    : {smtp_port}")
print(f"Usuario SMTP   : {smtp_user if smtp_user else '[NO CONFIGURADO]'}")
print(f"Password SMTP  : {'*' * len(smtp_password) if smtp_password else '[NO CONFIGURADO]'}")
print(f"Use TLS        : {smtp_use_tls}")
print(f"Destinatario   : {target_email if target_email else '[NO INDICADO]'}")
print("-" * 65)

# Paso 1: Validación de variables
if not smtp_user or not smtp_password or smtp_user == "tu_correo@gmail.com":
    print("❌ ERROR: Credenciales SMTP incompletas o usando valores por defecto.")
    print("   Por favor define en tu archivo .env:")
    print("     SMTP_USER=tu_correo@gmail.com")
    print("     SMTP_PASSWORD=tu_clave_de_aplicacion_de_16_letras")
    print("     (o SMTP_PASS=tu_clave_de_aplicacion_de_16_letras)")
    print("   Nota: Para cuentas Gmail DEBES generar una 'Contraseña de Aplicación' en:")
    print("   https://myaccount.google.com/apppasswords")
    sys.exit(1)

# Paso 2: Conectividad de Red / DNS al Host SMTP
print("1️⃣ Probando resolución DNS y conexión TCP al servidor...")
try:
    sock = socket.create_connection((smtp_host, smtp_port), timeout=10)
    sock.close()
    print(f"   ✅ Conexión TCP exitosa a {smtp_host}:{smtp_port}")
except Exception as e:
    print(f"   ❌ ERROR de conexión de red hacia {smtp_host}:{smtp_port}: {e}")
    print("   Posibles causas: Bloqueo de firewall, DNS no resuelve o puerto bloqueado por el ISP.")
    sys.exit(1)

# Paso 3: Handshake SMTP y Login
print("2️⃣ Conectando al protocolo SMTP y autenticando credenciales...")
clean_pwd = smtp_password.replace(" ", "")

try:
    if smtp_port == 465:
        server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
        print("   ✅ Conexión SSL establecida en puerto 465.")
    else:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
        print(f"   ✅ Conexión inicial SMTP establecida en puerto {smtp_port}.")
        if smtp_use_tls:
            server.starttls()
            print("   ✅ Negociación STARTTLS completada.")

    server.login(smtp_user, clean_pwd)
    print(f"   ✅ ¡Autenticación EXITOSA para el usuario: {smtp_user}!")

except smtplib.SMTPAuthenticationError as auth_err:
    print("   ❌ ERROR DE AUTENTICACIÓN SMTP (535):")
    print(f"      {auth_err}")
    print("\n   🔍 DIAGNÓSTICO:")
    print("   1. Si usas Gmail (@gmail.com), NO debes usar tu contraseña normal de acceso.")
    print("   2. Debes tener activada la 'Verificación en dos pasos' de Google.")
    print("   3. Genera una contraseña de aplicación de 16 caracteres en:")
    print("      https://myaccount.google.com/apppasswords")
    print("   4. Copia esa contraseña de 16 letras en tu .env como SMTP_PASSWORD o SMTP_PASS.")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ ERROR al conectar/autenticar con el servidor SMTP: {e}")
    sys.exit(1)

# Paso 4: Envío de correo de prueba
if not target_email:
    print("\n⚠️ No se especificó correo destinatario para enviar un mensaje de prueba.")
    print("   Pasa tu correo como argumento: python test_smtp.py tu_correo@gmail.com")
    server.quit()
    sys.exit(0)

print(f"3️⃣ Enviando mensaje de prueba a '{target_email}'...")
try:
    code_test = "849201"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🚆 Prueba Exitosa de Correo - BusYahu Rail ({code_test})"
    msg["From"] = f'"{smtp_from_name}" <{smtp_user}>'
    msg["To"] = target_email

    html = f"""
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
        <h2 style="color: #4f46e5; margin-top: 0;">🚆 BusYahu Rail - Correo de Prueba</h2>
        <p>¡Tu configuración de SMTP y correo electrónico está funcionando <strong>100% correctamente</strong>!</p>
        <div style="background: #eef2ff; border: 2px dashed #6366f1; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #3730a3; font-family: monospace;">{code_test}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">Prueba ejecutada desde test_smtp.py en el backend de BusYahu.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html", "utf-8"))

    server.send_message(msg)
    server.quit()
    print("   ✅ ¡CORREO ENVIADO CON ÉXITO! Revisa tu bandeja de entrada o carpeta de Spam.")
    print("=" * 65)
    print("🎉 TODO CONFIGURADO CORRECTAMENTE PARA EL REGISTRO REAL DE USUARIOS.")
    print("=" * 65)

except Exception as e:
    print(f"   ❌ ERROR al despachar el correo electrónico: {e}")
    try:
        server.quit()
    except Exception:
        pass
    sys.exit(1)
