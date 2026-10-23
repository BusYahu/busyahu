"""
Generación de un comprobante PDF de la reserva (con código QR de acceso).

Usa FPDF2 (dependencia ligera) que se añade en requirements.txt.
"""
import io
import os
from datetime import datetime


def _clean(value) -> str:
    """Convierte a texto seguro para los core fonts de FPDF (Latin-1)."""
    text = "" if value is None else str(value)
    return text.encode("latin-1", "replace").decode("latin-1")


def build_ticket_pdf(booking: dict, qr_png_bytes: bytes = None) -> bytes:
    from fpdf import FPDF

    train = booking.get("train") or {}
    passengers = booking.get("passengers") or []
    booking_code = booking.get("bookingCode") or booking.get("booking_code") or "N/A"
    travel_date = booking.get("travelDate") or booking.get("travel_date") or booking.get("date") or "N/A"
    status = booking.get("status") or "confirmed"
    total_price = booking.get("totalPrice") or booking.get("total_price") or 0
    currency = booking.get("currency") or "EUR"
    price_str = f"{total_price} {currency}"

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=12)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, _clean("BusYahu Rail - Comprobante de Pago y Billete"), new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, _clean(f"Emitido el {datetime.now().strftime('%Y-%m-%d %H:%M')}"), new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _clean(f"Localizador: {booking_code}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    rows = [
        ("Estado", status.upper()),
        ("Fecha de viaje", travel_date),
        ("Tren", train.get("trainNumber") or train.get("code") or train.get("id") or "N/A"),
        ("Operador", train.get("operator") or ""),
        ("Pais", train.get("country") or ""),
        ("Modelo", train.get("trainModel") or train.get("train_model") or ""),
        ("Origen", f"{train.get('fromCity') or ''} - {train.get('fromStation') or ''}".strip(" -")),
        ("Destino", f"{train.get('toCity') or ''} - {train.get('toStation') or ''}".strip(" -")),
        ("Salida", train.get("departureTime") or train.get("departure_time") or ""),
        ("Llegada", train.get("arrivalTime") or train.get("arrival_time") or ""),
        ("Duracion", train.get("duration") or ""),
    ]
    for label, val in rows:
        if val is None or str(val).strip() == "" or str(val).strip() == "-":
            continue
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(42, 7, _clean(label + ":"), new_x="RIGHT", new_y="TOP")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, _clean(val), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, _clean("Pasajeros y asientos asignados"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    for idx, p in enumerate(passengers, start=1):
        name = p.get("fullName") or p.get("full_name") or p.get("name") or ""
        doc = p.get("passportId") or p.get("passport_id") or p.get("dni") or ""
        seat = p.get("seatId") or p.get("seat_id") or ""
        cls = p.get("seatClass") or p.get("seat_class") or ""
        price = p.get("price")
        line = f"{idx}. {name}  |  Doc: {doc}  |  Asiento: {seat}  |  Clase: {cls}"
        if price is not None:
            line += f"  |  Tarifa: {price} {currency}"
        pdf.cell(0, 7, _clean(line), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, _clean(f"Tarifa total pagada: {price_str}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, _clean("Billete nominativo verificado. Presentar QR en torniquete de estacion."), new_x="LMARGIN", new_y="NEXT")

    if qr_png_bytes:
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 6, _clean("Codigo QR de acceso"), new_x="LMARGIN", new_y="NEXT")
        y = pdf.get_y()
        x_qr = pdf.l_margin
        img_stream = io.BytesIO(qr_png_bytes)
        pdf.image(img_stream, x=x_qr, y=y, w=45)

        # Logo morado a la derecha del QR
        logo_path = os.path.join(os.path.dirname(__file__), "assets", "logo_morado.png")
        if os.path.exists(logo_path):
            pdf.image(logo_path, x=x_qr + 55, y=y, w=45)

        pdf.ln(50)

    qr_payload = booking.get("qrPayload") or booking.get("qr_payload")
    if qr_payload:
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 5, _clean(f"Payload QR: {qr_payload}"), new_x="LMARGIN", new_y="NEXT")

    output = pdf.output()
    return bytes(output)