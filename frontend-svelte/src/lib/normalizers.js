import { normalizeUser } from './storage.js';

const FLAG_BY_COUNTRY = {
  ES: '🇪🇸',
  FR: '🇫🇷',
  DE: '🇩🇪',
  BE: '🇧🇪',
  GB: '🇬🇧',
  UK: '🇬🇧',
  US: '🇺🇸',
  CA: '🇨🇦',
  RU: '🇷🇺',
  CN: '🇨🇳',
  IN: '🇮🇳',
  JP: '🇯🇵',
};

const CURRENCY_SYMBOL = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  RUB: '₽',
  CNY: '¥',
  JPY: '¥',
  INR: '₹',
};

export function flagEmojiFromCode(code) {
  return FLAG_BY_COUNTRY[String(code || '').toUpperCase()] ?? '🌍';
}

export function currencySymbolFromCode(code) {
  return CURRENCY_SYMBOL[String(code || '').toUpperCase()] ?? code;
}

export function toCamelCaseKey(key) {
  return key
    .replace(/[_\-\s]+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function toSnakeCaseKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Normaliza cualquier respuesta (Pydantic suele devolver camelCase, pero
 * algunos endpoints o mocks usan snake_case) a un único contrato camelCase.
 */
export function camelizeDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeDeep(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const target = {};
    for (const [key, item] of Object.entries(value)) {
      target[toCamelCaseKey(key)] = camelizeDeep(item);
    }
    return target;
  }
  return value;
}

/**
 * Añade alias snake_case a un payload camelCase. Así el mismo body es válido
 * tanto para Mongoose/Express (camelCase) como para routers FastAPI que
 * aceptan ambos formatos. Pydantic ignora los campos extra.
 */
export function addSnakeAliases(value) {
  if (Array.isArray(value)) {
    return value.map((item) => addSnakeAliases(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const target = {};
    for (const [key, item] of Object.entries(value)) {
      const normalized = addSnakeAliases(item);
      target[key] = normalized;
      const snake = toSnakeCaseKey(key);
      if (snake !== key && !(snake in target)) {
        target[snake] = normalized;
      }
    }
    return target;
  }
  return value;
}

export function normalizeAuthResponse(rawResponse) {
  const payload = (rawResponse?.data ?? rawResponse ?? {});
  const nestedUser = payload.user ?? {};
  const token = String(
    payload.token ?? payload.access_token ?? payload.accessToken ?? nestedUser.token ?? '',
  );
  const user = normalizeUser({
    ...nestedUser,
    id: String(payload.id ?? nestedUser.id ?? ''),
    email: String(payload.email ?? nestedUser.email ?? ''),
    name: String(payload.name ?? nestedUser.name ?? payload.firstName ?? ''),
    role: String(payload.role ?? nestedUser.role ?? 'client'),
  });
  return { token, user, raw: payload };
}

export function buildStationIndex(destinations = []) {
  const index = {};
  for (const destination of destinations) {
    for (const city of destination.cities || []) {
      if (!city.stationId) continue;
      index[city.stationId] = {
        city: city.name,
        station: city.station,
        country: destination.country,
        countryCode: destination.countryCode,
        currency: destination.currency,
        currencySymbol: destination.currencySymbol,
      };
    }
  }
  return index;
}

export function normalizeDestinations(rawResponse) {
  const payload = rawResponse ?? {};
  const list = Array.isArray(payload)
    ? payload
    : (payload.destinations ?? payload.data ?? []);

  return (Array.isArray(list) ? list : []).map((item) => {
    const raw = item ?? {};
    const countryCode = String(raw.countryCode ?? raw.code ?? '').toUpperCase();
    const rawCities = raw.stations ?? raw.cities ?? [];
    const cities = (Array.isArray(rawCities) ? rawCities : []).map((cityItem, index) => {
      const city = cityItem ?? {};
      return {
        name: String(city.city ?? city.name ?? ''),
        station: String(city.name ?? city.station ?? ''),
        stationId: String(city.id ?? city.stationId ?? `${countryCode}-${index + 1}`),
      };
    });

    const currency = String(raw.currency ?? 'EUR');
    return {
      id: countryCode ? countryCode.toLowerCase() : String(raw.id ?? '').toLowerCase(),
      country: String(raw.countryName ?? raw.country ?? raw.name ?? countryCode),
      countryCode,
      flagEmoji: String(raw.flagEmoji ?? flagEmojiFromCode(countryCode)),
      currency,
      currencySymbol: String(raw.symbol ?? raw.currencySymbol ?? currencySymbolFromCode(currency)),
      cities,
    };
  });
}

export function normalizeTrainSummary(rawTrain, destinations = [], fallbackTrain = null) {
  const raw = rawTrain ?? {};
  const index = buildStationIndex(destinations);
  const fromStationId = String(raw.originStationId ?? raw.fromStationId ?? '');
  const toStationId = String(raw.destinationStationId ?? raw.toStationId ?? '');
  const from = index[fromStationId];
  const to = index[toStationId];
  const countryCode = String(
    raw.countryCode ?? from?.countryCode ?? fallbackTrain?.countryCode ?? '',
  ).toUpperCase();
  const destination = destinations.find((item) => item.countryCode === countryCode);
  const currency = String(raw.currency ?? destination?.currency ?? fallbackTrain?.currency ?? 'EUR');
  const carriages = Array.isArray(raw.carriages) ? raw.carriages : [];
  const carriagesCount = Number(raw.carriagesCount ?? carriages.length ?? 0);

  return {
    id: String(raw.id ?? raw.trainId ?? raw.code ?? fallbackTrain?.id ?? ''),
    trainNumber: String(raw.code ?? raw.trainNumber ?? fallbackTrain?.trainNumber ?? ''),
    operator: String(raw.name ?? raw.operator ?? fallbackTrain?.operator ?? ''),
    country:
      from?.country ??
      destination?.country ??
      String(raw.country ?? fallbackTrain?.country ?? countryCode),
    countryCode,
    fromCity: from?.city ?? String(raw.fromCity ?? fallbackTrain?.fromCity ?? fromStationId),
    fromStation: from?.station ?? String(raw.fromStation ?? fallbackTrain?.fromStation ?? fromStationId),
    toCity: to?.city ?? String(raw.toCity ?? fallbackTrain?.toCity ?? toStationId),
    toStation: to?.station ?? String(raw.toStation ?? fallbackTrain?.toStation ?? toStationId),
    departureTime: String(raw.departureTime ?? fallbackTrain?.departureTime ?? '08:30'),
    arrivalTime: String(raw.arrivalTime ?? fallbackTrain?.arrivalTime ?? '11:45'),
    duration: String(raw.duration ?? fallbackTrain?.duration ?? '3h 15m'),
    basePrice: Number(raw.basePrice ?? fallbackTrain?.basePrice ?? 0),
    currency,
    trainModel: String(raw.type ?? raw.trainModel ?? fallbackTrain?.trainModel ?? raw.name ?? ''),
    availableSeatsCount: Number(
      raw.availableSeatsCount ??
        (carriagesCount > 0 ? carriagesCount * 40 : fallbackTrain?.availableSeatsCount ?? 0),
    ),
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.map(String)
      : fallbackTrain?.amenities ?? ['Wi-Fi Gratuito', 'Toma de corriente', 'Coche cafetería'],
  };
}

export function normalizeTrains(rawResponse, destinations = []) {
  const payload = rawResponse ?? {};
  const list = Array.isArray(payload) ? payload : (payload.trains ?? payload.data ?? []);
  return (Array.isArray(list) ? list : []).map((item) =>
    normalizeTrainSummary(item, destinations),
  );
}

function normalizeSeatClass(value) {
  const normalized = String(value ?? 'Standard').toLowerCase();
  if (normalized === 'first') return 'first';
  if (normalized === 'business') return 'business';
  return 'tourist';
}

export function normalizeBooking(rawBooking, destinations = [], fallbackTrain = null) {
  const raw = rawBooking ?? {};
  const rawPassengers = raw.passengers ?? [];
  const passengers = (Array.isArray(rawPassengers) ? rawPassengers : []).map((item) => {
    const passenger = item ?? {};
    return {
      fullName: String(passenger.fullName ?? passenger.name ?? ''),
      passportId: String(passenger.passportId ?? passenger.documentId ?? ''),
      seatId: String(passenger.seatId ?? passenger.seat ?? ''),
      seatClass: normalizeSeatClass(passenger.seatClass),
      price: Number(passenger.price ?? 0),
    };
  });

  const seats = Array.isArray(raw.seats)
    ? raw.seats.map(String)
    : passengers.map((passenger) => passenger.seatId);

  return {
    id: String(raw.id ?? raw._id ?? raw.bookingCode ?? ''),
    bookingCode: String(raw.bookingCode ?? ''),
    train: normalizeTrainSummary(raw.train, destinations, fallbackTrain),
    trainId: String(raw.trainId ?? raw.train?.id ?? fallbackTrain?.id ?? ''),
    travelDate: String(raw.travelDate ?? raw.date ?? ''),
    date: String(raw.date ?? raw.travelDate ?? ''),
    seats,
    passengers,
    totalPrice: Number(raw.totalPrice ?? 0),
    currency: String(raw.currency ?? fallbackTrain?.currency ?? 'EUR'),
    createdAt: String(raw.createdAt ?? ''),
    status: raw.status === 'cancelled' ? 'cancelled' : 'confirmed',
    qrPayload: String(raw.qrPayload ?? ''),
    qrCode: raw.qrCode ? String(raw.qrCode) : undefined,
    userEmail: String(raw.userEmail ?? ''),
  };
}

export function normalizeBookings(rawResponse, destinations = []) {
  const payload = rawResponse ?? {};
  const list = Array.isArray(payload) ? payload : (payload.bookings ?? payload.data ?? []);
  return (Array.isArray(list) ? list : []).map((item) => normalizeBooking(item, destinations));
}

export function normalizeSeatMap(rawResponse) {
  const raw = rawResponse ?? {};
  const carriages = raw.carriages ?? [];
  return {
    trainId: String(raw.trainId ?? ''),
    trainCode: String(raw.trainCode ?? ''),
    trainName: String(raw.trainName ?? ''),
    date: String(raw.date ?? ''),
    totalCarriages: Number(raw.totalCarriages ?? carriages.length ?? 0),
    carriages: (Array.isArray(carriages) ? carriages : []).map((item) => {
      const carriage = item ?? {};
      const seats = carriage.seats ?? [];
      return {
        carriageNumber: Number(carriage.carriageNumber ?? 0),
        classType: String(carriage.classType ?? ''),
        seats: (Array.isArray(seats) ? seats : []).map((seatItem) => {
          const seat = seatItem ?? {};
          return {
            seatNumber: String(seat.seatNumber ?? ''),
            row: Number(seat.row ?? 0),
            column: String(seat.column ?? ''),
            classType: String(seat.classType ?? ''),
            status: seat.status === 'ocupado' ? 'ocupado' : 'libre',
            price: Number(seat.price ?? 0),
          };
        }),
      };
    }),
  };
}

export function canonicalSeatClass(value) {
  const normalized = String(value ?? 'tourist').toLowerCase();
  if (normalized === 'first') return 'First';
  if (normalized === 'business') return 'Business';
  return 'Standard';
}
