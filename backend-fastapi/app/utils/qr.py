import io
import base64
import logging

logger = logging.getLogger("fastapi")

def generate_qr_base64(payload: str) -> str:
    """
    Genera un código QR verificable utilizando la librería qrcode
    y lo retorna codificado como Data URL en Base64 (data:image/png;base64,...).
    """
    try:
        import qrcode
        from qrcode.constants import ERROR_CORRECT_M

        qr = qrcode.QRCode(
            version=1,
            error_correction=ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        logger.warning(f"No se pudo generar QR binario con qrcode/PIL: {e}. Generando fallback SVG.")
        # Fallback ultra liviano en caso de entorno sin PIL
        encoded_data = base64.b64encode(payload.encode("utf-8")).decode("utf-8")
        return f"data:text/plain;base64,{encoded_data}"
