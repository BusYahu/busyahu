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
} from '../lib/normalizers.js';

describe('claves y códigos', () => {
  it('convierte entre camelCase y snake_case', () => {
    expect(toCamelCaseKey('base_price')).toBe('basePrice');
    expect(toCamelCaseKey('from-city')).toBe('fromCity');
    expect(toSnakeCaseKey('basePrice')).toBe('base_price');
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
    expect(camelizeDeep({ base_price: 10, nested: [{ user_name: 'Ana' }] })).toEqual({
      basePrice: 10,
      nested: [{ userName: 'Ana' }],
    });
  });

  it('agrega alias snake_case a payloads camelCase', () => {
    expect(addSnakeAliases({ travelDate: '2026-09-20' })).toEqual({
      travelDate: '2026-09-20',
      travel_date: '2026-09-20',
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
          stations: [{ id: 'ES-MAD', name: 'Madrid Atocha', city: 'Madrid' }],
        },
      ],
    });

    expect(destination.countryCode).toBe('ES');
    expect(destination.cities[0].stationId).toBe('ES-MAD');
  });

  it('normaliza una reserva cancelada', () => {
    const booking = normalizeBooking({
      id: 'BK-1',
      date: '2026-09-20',
      status: 'cancelled',
      passengers: [{ name: 'Ana', seat: '1-1A', seatClass: 'first', price: 90 }],
    });

    expect(booking.status).toBe('cancelled');
    expect(booking.passengers[0].seatClass).toBe('first');
  });

  it('canoniza clases de asiento', () => {
    expect(canonicalSeatClass('First')).toBe('First');
    expect(canonicalSeatClass('business')).toBe('Business');
    expect(canonicalSeatClass('otra')).toBe('Standard');
  });
});
