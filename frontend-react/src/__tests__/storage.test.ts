import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEYS,
  clearSession,
  getActiveBackend,
  getToken,
  readCachedBookings,
  readSearchFilters,
  readSession,
  saveCachedBookings,
  saveSearchFilters,
  saveSession,
  setActiveBackend,
} from '../lib/storage';

const store = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
};

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: localStorageMock,
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
});

describe('almacenamiento compartido', () => {
  it('guarda y lee la sesión normalizada', () => {
    saveSession({ id: 'u1', email: 'ana@test.local', name: 'Ana', role: 'client' }, 'token-1');

    expect(getToken()).toBe('token-1');
    const session = readSession();
    expect(session.user?.email).toBe('ana@test.local');
    expect(session.backend).toBe('express');
  });

  it('limpia token, usuario y reserva activa', () => {
    saveSession({ id: 'u1', email: 'ana@test.local', name: 'Ana', role: 'admin' }, 'token-1');
    clearSession();

    expect(getToken()).toBeNull();
    expect(readSession().user).toBeNull();
  });

  it('cambia el backend activo con validación', () => {
    expect(getActiveBackend()).toBe('express');
    setActiveBackend('fastapi');
    expect(getActiveBackend()).toBe('fastapi');
    expect(store.get(STORAGE_KEYS.activeBackend)).toBe('fastapi');
  });

  it('persiste filtros de búsqueda con timestamp', () => {
    saveSearchFilters({ fromCity: 'Madrid', toCity: 'Barcelona', passengerCount: 2 });
    const filters = readSearchFilters();

    expect(filters.fromCity).toBe('Madrid');
    expect(filters.passengerCount).toBe(2);
    expect(filters.updatedAt).toBeTruthy();
  });

  it('cachea reservas y tolera JSON inválido', () => {
    saveCachedBookings([
      {
        id: 'BK-1',
        bookingCode: 'RW-ES-1',
        train: {
          id: 't1',
          trainNumber: 'AVE-1',
          operator: 'Renfe',
          country: 'España',
          fromCity: 'Madrid',
          fromStation: 'Atocha',
          toCity: 'Barcelona',
          toStation: 'Sants',
          departureTime: '08:00',
          arrivalTime: '11:00',
          duration: '3h',
          basePrice: 90,
          currency: 'EUR',
          trainModel: 'S-103',
          availableSeatsCount: 10,
          amenities: [],
        },
        travelDate: '2026-09-20',
        date: '2026-09-20',
        seats: ['1-1A'],
        passengers: [],
        totalPrice: 90,
        currency: 'EUR',
        createdAt: '2026-09-04 14:30',
        status: 'confirmed',
        qrPayload: '',
      },
    ]);

    expect(readCachedBookings()).toHaveLength(1);

    store.set(STORAGE_KEYS.bookings, '{json-invalido');
    expect(readCachedBookings()).toEqual([]);
  });
});
