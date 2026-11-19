import { describe, expect, it } from 'vitest';
import {
  addSnakeAliases,
  camelizeDeep,
  canonicalSeatClass,
  currencySymbolFromCode,
  flagEmojiFromCode,
  normalizeBooking,
  normalizeDestinations,
  toCamelCaseKey,
  toSnakeCaseKey,
} from '../lib/normalizers';

describe('claves y códigos', () => {
  it('convierte entre camelCase y snake_case', () => {
    expect(toCamelCaseKey('base_price')).toBe('basePrice');
    expect(toCamelCaseKey('from-city')).toBe('fromCity');
    expect(toSnakeCaseKey('basePrice')).toBe('base_price');
    expect(toSnakeCaseKey('fromCity')).toBe('from_city');
  });

  it('resuelve banderas y monedas con fallback', () => {
    expect(flagEmojiFromCode('ES')).toBe('🇪🇸');
    expect(flagEmojiFromCode('ZZ')).toBe('🌍');
    expect(currencySymbolFromCode('EUR')).toBe('€');
    expect(currencySymbolFromCode('XXX')).toBe('XXX');
  });
});

describe('camelizeDeep y addSnakeAliases', () => {
  it('normaliza objetos anidados y listas', () => {
    const source = { base_price: 10, nested: [{ user_name: 'Ana' }] };
    expect(camelizeDeep(source)).toEqual({ basePrice: 10, nested: [{ userName: 'Ana' }] });
  });

  it('acepta arreglos sin romper valores primitivos', () => {
    expect(camelizeDeep([1, 'dos', null])).toEqual([1, 'dos', null]);
  });

  it('agrega alias snake_case a payloads camelCase', () => {
    const aliased = addSnakeAliases({ travelDate: '2026-09-20', basePrice: 10 });
    expect(aliased).toEqual({
      travelDate: '2026-09-20',
      travel_date: '2026-09-20',
      basePrice: 10,
      base_price: 10,
    });
  });
});

describe('normalización de destinos y reservas', () => {
  it('normaliza destinos desde estaciones', () => {
    const [destination] = normalizeDestinations({
      destinations: [
        {
          countryCode: 'ES',
          countryName: 'España',
          currency: 'EUR',
          stations: [{ id: 'ES-MAD', name: 'Madrid Atocha', city: 'Madrid' }],
        },
      ],
    });

    expect(destination.countryCode).toBe('ES');
    expect(destination.currencySymbol).toBe('€');
    expect(destination.cities[0]).toEqual({
      name: 'Madrid',
      station: 'Madrid Atocha',
      stationId: 'ES-MAD',
    });
  });

  it('normaliza una reserva cancelada y sus pasajeros', () => {
    const booking = normalizeBooking({
      id: 'BK-1',
      bookingCode: 'RW-ES-1',
      date: '2026-09-20',
      seats: ['1-1A'],
      status: 'cancelled',
      passengers: [
        { name: 'Ana', documentId: 'PAS-1', seat: '1-1A', seatClass: 'business', price: 91.7 },
      ],
    });

    expect(booking.status).toBe('cancelled');
    expect(booking.passengers[0].fullName).toBe('Ana');
    expect(booking.passengers[0].seatClass).toBe('business');
    expect(booking.train.basePrice).toBe(0);
  });

  it('canoniza clases de asiento', () => {
    expect(canonicalSeatClass('First')).toBe('First');
    expect(canonicalSeatClass('business')).toBe('Business');
    expect(canonicalSeatClass('otra')).toBe('Standard');
  });
});
