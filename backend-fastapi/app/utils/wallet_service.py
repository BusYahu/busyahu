"""Servicio de generacion de passes para Apple/Google Wallet usando WalletWallet."""

import base64
import json
import logging
import os
import urllib.request
import urllib.error
import urllib.parse

from app.config import settings

logger = logging.getLogger(__name__)

WALLET_API_BASE = "https://api.walletwallet.dev"

STATION_PLACE_IDS = {
    "ES-MAD": "IAEA6F66CDB89207C",
    "ES-BCN": "I56D8F21B40F1528D",
    "ES-SVQ": "ID156519E5EF2719A",
    "ES-SEV": "ID156519E5EF2719A",
    "ES-VLC": "ID7122D71388257F1",
    "madrid": "IAEA6F66CDB89207C",
    "barcelona": "I56D8F21B40F1528D",
    "seville": "ID156519E5EF2719A",
    "sevilla": "ID156519E5EF2719A",
    "valencia": "ID7122D71388257F1",
    "valencia": "ID7122D71388257F1",
}


def _resolve_place_id(train):
    # 1) Override explicito
    for key in ("applePlaceId", "placeIdentifier", "place_id", "apple_place_id"):
        val = train.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    # 2) Por id de estacion de origen
    sid = (train.get("originStationId") or train.get("origin_station_id") or "").strip()
    if sid and sid in STATION_PLACE_IDS:
        return STATION_PLACE_IDS[sid]
    # 3) Por ciudad de origen
    city = (train.get("fromCity") or train.get("from_city") or "").strip().lower()
    if city and city in STATION_PLACE_IDS:
        return STATION_PLACE_IDS[city]
    return ""


def _logo_data_uri():
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "assets", "logo.png"),
        os.path.join(os.path.dirname(__file__), "..", "..", "imgs", "logo.png"),
    ]
    for path in candidates:
        path = os.path.abspath(path)
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("ascii")
                return "data:image/png;base64," + b64
            except Exception as e:
                logger.warning("No se pudo leer el logo %s: %s", path, e)
    return ""


def _train_summary(booking):
    return booking.get("train") or {}


def create_wallet_pass(booking):
    api_key = (settings.WALLETWALLET_API_KEY or "").strip()
    if not api_key:
        raise RuntimeError("WALLETWALLET_API_KEY no configurada")

    booking_code = booking.get("bookingCode") or booking.get("booking_code") or "N/A"
    train = _train_summary(booking)
    from_city = train.get("fromCity") or train.get("from_city") or ""
    to_city = train.get("toCity") or train.get("to_city") or ""
    travel_date = booking.get("travelDate") or booking.get("travel_date") or booking.get("date") or ""
    passengers = booking.get("passengers") or []
    first_passenger = passengers[0] if passengers else {}
    passenger_name = first_passenger.get("fullName") or first_passenger.get("full_name") or "Viajero"
    seat_id = first_passenger.get("seatId") or first_passenger.get("seat_id") or ""
    qr_payload = booking.get("qrPayload") or booking.get("qr_payload") or booking_code

    primary_fields = []
    if from_city and to_city:
        primary_fields.append({"label": "RUTA", "value": f"{from_city} -> {to_city}"})
    if travel_date:
        primary_fields.append({"label": "FECHA", "value": str(travel_date)})
    if not primary_fields:
        primary_fields.append({"label": "BILLETE", "value": str(booking_code)})

    secondary_fields = [{"label": "PASAJERO", "value": str(passenger_name)[:256]}]
    if seat_id:
        secondary_fields.append({"label": "ASIENTO", "value": str(seat_id)})

    header_fields = [{"label": "LOCALIZADOR", "value": str(booking_code)}]

    featured_actions = []
    place_id = _resolve_place_id(train)
    origin_query = (from_city or "").strip()
    if place_id:
        ga_url = "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(origin_query or from_city or "")
        featured_actions.append({
            "identifier": "go_to_location",
            "type": "place",
            "placeIdentifier": place_id,
            "url": ga_url,
        })
    stay_city = (to_city or from_city or "").strip()
    if stay_city:
        booking_url = "https://www.booking.com/searchresults.html?ss=" + urllib.parse.quote(stay_city)
        featured_actions.append({
            "identifier": "book_stay",
            "type": "bookStay",
            "url": booking_url,
        })

    body = {
        "barcodeValue": str(qr_payload)[:1024],
        "barcodeFormat": "QR",
        "logoText": "BusYahu Rail",
        "organizationName": "BusYahu Rail",
        "description": "Billete BusYahu " + str(booking_code),
        "primaryFields": primary_fields,
        "secondaryFields": secondary_fields,
        "headerFields": header_fields,
        "colorPreset": "blue",
        "sharingProhibited": False,
    }
    if featured_actions:
        body["featuredActions"] = featured_actions

    logo_uri = _logo_data_uri()
    if logo_uri:
        body["logoURL"] = logo_uri

    url = WALLET_API_BASE + "/api/passes?format=json"

    def _do_request(payload_body):
        req = urllib.request.Request(
            url,
            data=json.dumps(payload_body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + api_key,
                "User-Agent": "BusYahu/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)

    try:
        data = _do_request(body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        if featured_actions and e.code in (400, 403):
            logger.warning("WalletWallet rechazo featuredActions (%s): %s. Reintentando sin botones.", e.code, err_body)
            body.pop("featuredActions", None)
            try:
                data = _do_request(body)
            except Exception as e2:
                logger.exception("Error reintentando sin featuredActions")
                raise RuntimeError("Error generando pass de wallet: " + str(e2))
        else:
            logger.error("WalletWallet HTTP %s: %s", e.code, err_body)
            raise RuntimeError("WalletWallet error %s: %s" % (e.code, err_body))
    except Exception as e:
        logger.exception("Error llamando a WalletWallet")
        raise RuntimeError("Error generando pass de wallet: " + str(e))

    return {
        "serialNumber": data.get("serialNumber"),
        "googleSaveUrl": data.get("googleSaveUrl"),
        "applePass": data.get("applePass"),
        "shareUrl": data.get("shareUrl"),
        "expirationDate": data.get("expirationDate"),
        "featuredActionsIncluded": "featuredActions" in body,
    }