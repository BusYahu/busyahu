import type { Booking, Destination, Passenger, TrainRoute } from '../types';
import { normalizeUser } from './storage';

export type BackendId = 'express' | 'fastapi';

const FLAG_BY_COUNTRY: Record<string, string> = {
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

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  RUB: '₽',
  CNY: '¥',
  JPY: '¥',
  INR: '₹',
};

export function flagEmojiFromCode(code: string): string {
  return FLAG_BY_COUNTRY[String(code || '').toUpperCase()] ?? '🌍';
}

export function currencySymbolFromCode(code: string): string {
  return CURRENCY_SYMBOL[String(code || '').toUpperCase()] ?? code;
}

export function toCamelCaseKey(key: string): string {
  return key
    .replace(/[_\-\s]+([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

export function toSnakeCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Normaliza cualquier respuesta (Pydantic suele devolver camelCase, pero
 * algunos endpoints o mocks usan snake_case) a un único contrato camelCase.
 */
export function camelizeDeep<T = unknown>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeDeep(item)) as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      target[toCamelCaseKey(key)] = camelizeDeep(item);
    }
    return target as T;
  }
  return value as T;
}

/**
 * Añade alias snake_case a un payload camelCase. Así el mismo body es válido
 * tanto para Mongoose/Express (camelCase) como para routers FastAPI que
 * aceptan ambos formatos. Pydantic ignora los campos extra.
 */
export function addSnakeAliases(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => addSnakeAliases(item));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
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

export interface NormalizedAuth {
  token: string;
  user: ReturnType<typeof normalizeUser>;
  raw: Record<string, unknown>;
}

export function normalizeAuthResponse(rawResponse: unknown): NormalizedAuth {
  const payload = ((rawResponse as { data?: unknown })?.data ?? rawResponse ?? {}) as Record<string, unknown>;
  const nestedUser = (payload.user ?? {}) as Record<string, unknown>;
  const token = String(
    payload.token ??
      payload.access_token ??
      payload.accessToken ??
      nestedUser.token ??
      '',
  );
  const rawRole = String(payload.role ?? nestedUser.role ?? 'client').toLowerCase();
  const user = normalizeUser({
    id: String(payload.id ?? nestedUser.id ?? ''),
    email: String(payload.email ?? nestedUser.email ?? ''),
    name: String(payload.name ?? nestedUser.name ?? payload.firstName ?? ''),
    role: rawRole === 'admin' ? 'admin' : 'client',
  });
  return { token, user, raw: payload };
}

interface StationIndexEntry {
  city: string;
  station: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
}

export function buildStationIndex(destinations: Destination[]): Record<string, StationIndexEntry> {
  const index: Record<string, StationIndexEntry> = {};
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

export function normalizeDestinations(rawResponse: unknown): Destination[] {
  const payload = (rawResponse ?? {}) as Record<string, unknown>;
  const list = Array.isArray(payload)
    ? payload
    : ((payload.destinations ?? payload.data ?? []) as unknown[]);

  return (Array.isArray(list) ? list : []).map((item) => {
    const raw = item as Record<string, unknown>;
    const countryCode = String(raw.countryCode ?? raw.code ?? '').toUpperCase();
    const rawCities = (raw.stations ?? raw.cities ?? []) as unknown[];
    const cities = (Array.isArray(rawCities) ? rawCities : []).map((cityItem, index) => {
      const city = cityItem as Record<string, unknown>;
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
    } satisfies Destination;
  });
}

export function normalizeTrainSummary(
  rawTrain: unknown,
  destinations: Destination[] = [],
  fallbackTrain?: TrainRoute | null,
): TrainRoute {
  const raw = (rawTrain ?? {}) as Record<string, unknown>;
  const index = buildStationIndex(destinations);
  const fromStationId = String(raw.originStationId ?? raw.fromStationId ?? '');
  const toStationId = String(raw.destinationStationId ?? raw.toStationId ?? '');
  const from = index[fromStationId];
  const to = index[toStationId];
  const countryCode = String(raw.countryCode ?? from?.countryCode ?? fallbackTrain?.countryCode ?? '').toUpperCase();
  const destination = destinations.find((item) => item.countryCode === countryCode);
  const currency = String(raw.currency ?? destination?.currency ?? fallbackTrain?.currency ?? 'EUR');
  const carriages = Array.isArray(raw.carriages) ? raw.carriages : [];
  const carriagesCount = Number(raw.carriagesCount ?? carriages.length ?? 0);

  return {
    id: String(raw.id ?? raw.trainId ?? raw.code ?? fallbackTrain?.id ?? ''),
    trainNumber: String(raw.code ?? raw.trainNumber ?? fallbackTrain?.trainNumber ?? ''),
    operator: String(raw.name ?? raw.operator ?? fallbackTrain?.operator ?? ''),
    country: from?.country ?? destination?.country ?? String(raw.country ?? fallbackTrain?.country ?? countryCode),
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
      raw.availableSeatsCount ?? (carriagesCount > 0 ? carriagesCount * 40 : fallbackTrain?.availableSeatsCount ?? 0),
    ),
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.map(String)
      : fallbackTrain?.amenities ?? ['Wi-Fi Gratuito', 'Toma de corriente', 'Coche cafetería'],
  };
}

export function normalizeTrains(rawResponse: unknown, destinations: Destination[] = []): TrainRoute[] {
  const payload = (rawResponse ?? {}) as Record<string, unknown>;
  const list = Array.isArray(payload)
    ? payload
    : ((payload.trains ?? payload.data ?? []) as unknown[]);

  return (Array.isArray(list) ? list : []).map((item) =>
    normalizeTrainSummary(item, destinations),
  );
}

function normalizeSeatClass(value: unknown): Passenger['seatClass'] {
  const normalized = String(value ?? 'Standard').toLowerCase();
  if (normalized === 'first') return 'first';
  if (normalized === 'business') return 'business';
  return 'tourist';
}

export function normalizeBooking(
  rawBooking: unknown,
  destinations: Destination[] = [],
  fallbackTrain?: TrainRoute | null,
): Booking {
  const raw = (rawBooking ?? {}) as Record<string, unknown>;
  const rawTrain = (raw.train ?? {}) as Record<string, unknown>;
  const rawPassengers = (raw.passengers ?? []) as unknown[];
  const passengers: Passenger[] = (Array.isArray(rawPassengers) ? rawPassengers : []).map((item) => {
    const passenger = item as Record<string, unknown>;
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
    trainId: String(raw.trainId ?? rawTrain.id ?? fallbackTrain?.id ?? ''),
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

export function normalizeBookings(rawResponse: unknown, destinations: Destination[] = []): Booking[] {
  const payload = (rawResponse ?? {}) as Record<string, unknown>;
  const list = Array.isArray(payload)
    ? payload
    : ((payload.bookings ?? payload.data ?? []) as unknown[]);
  return (Array.isArray(list) ? list : []).map((item) => normalizeBooking(item, destinations));
}

export interface NormalizedSeat {
  seatNumber: string;
  row: number;
  column: string;
  classType: string;
  status: 'libre' | 'ocupado';
  price: number;
}

export interface NormalizedCarriage {
  carriageNumber: number;
  classType: string;
  seats: NormalizedSeat[];
}

export interface NormalizedSeatMap {
  trainId: string;
  trainCode: string;
  trainName: string;
  date: string;
  totalCarriages: number;
  carriages: NormalizedCarriage[];
}

export function normalizeSeatMap(rawResponse: unknown): NormalizedSeatMap {
  const raw = (rawResponse ?? {}) as Record<string, unknown>;
  const carriages = (raw.carriages ?? []) as unknown[];
  return {
    trainId: String(raw.trainId ?? ''),
    trainCode: String(raw.trainCode ?? ''),
    trainName: String(raw.trainName ?? ''),
    date: String(raw.date ?? ''),
    totalCarriages: Number(raw.totalCarriages ?? carriages.length ?? 0),
    carriages: (Array.isArray(carriages) ? carriages : []).map((item) => {
      const carriage = item as Record<string, unknown>;
      const seats = (carriage.seats ?? []) as unknown[];
      return {
        carriageNumber: Number(carriage.carriageNumber ?? 0),
        classType: String(carriage.classType ?? ''),
        seats: (Array.isArray(seats) ? seats : []).map((seatItem) => {
          const seat = seatItem as Record<string, unknown>;
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

export function canonicalSeatClass(value: unknown): 'Standard' | 'First' | 'Business' {
  const normalized = String(value ?? 'tourist').toLowerCase();
  if (normalized === 'first') return 'First';
  if (normalized === 'business') return 'Business';
  return 'Standard';
}
