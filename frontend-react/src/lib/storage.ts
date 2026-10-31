import type { Booking, User } from '../types';

/**
 * Esquema único de almacenamiento compartido entre React y Svelte.
 * Cualquier frontend (o pestaña) que use estas claves puede leer la misma
 * sesión, el mismo backend activo y el mismo estado de reservas.
 */
export const STORAGE_KEYS = {
  token: 'busyahu_token',
  user: 'busyahu_user',
  activeBackend: 'busyahu_active_backend',
  searchFilters: 'busyahu_search_filters',
  bookings: 'busyahu_bookings',
  activeBooking: 'busyahu_active_booking',
  environment: 'busyahu_environment',
} as const;

export const STORAGE_EVENTS = {
  backendChanged: 'busyahu:backend-changed',
  sessionChanged: 'busyahu:session-changed',
  searchChanged: 'busyahu:search-changed',
  bookingsChanged: 'busyahu:bookings-changed',
  api: 'busyahu:api-event',
} as const;

export interface SharedSearchFilters {
  countryId?: string;
  fromCity?: string;
  toCity?: string;
  travelDate?: string;
  passengerCount?: number;
  selectedClass?: 'tourist' | 'first' | 'business';
  updatedAt?: string;
}

export interface SharedSession {
  token: string | null;
  user: User | null;
  backend: 'express' | 'fastapi';
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readRaw(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

export function writeRaw(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}

export function removeRaw(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

export function emitStorageEvent<T>(name: string, detail: T): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function normalizeUser(raw: Partial<User> & { role?: string } | null): User | null {
  if (!raw) return null;
  const role = raw.role === 'admin' ? 'admin' : 'client';
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    role,
  };
}

export function getToken(): string | null {
  const token = readRaw(STORAGE_KEYS.token);
  if (token) return token;
  // Compatibilidad con versiones anteriores que sólo guardaban el token
  // dentro del objeto 'busyahu_user'.
  const user = safeParse<User & { token?: string }>(readRaw(STORAGE_KEYS.user));
  return user?.token ?? null;
}

export function getStoredUser(): (User & { token?: string }) | null {
  const user = safeParse<User & { token?: string }>(readRaw(STORAGE_KEYS.user));
  return user;
}

export function saveSession(user: User | null, token?: string | null): void {
  if (token) {
    writeRaw(STORAGE_KEYS.token, token);
  }
  if (user) {
    const normalized = normalizeUser(user);
    if (!normalized) return;
    writeRaw(STORAGE_KEYS.user, JSON.stringify({ ...normalized, token: token ?? getToken() ?? undefined }));
  }
  emitStorageEvent(STORAGE_EVENTS.sessionChanged, readSession());
}

export function clearSession(): void {
  removeRaw(STORAGE_KEYS.token);
  removeRaw(STORAGE_KEYS.user);
  removeRaw(STORAGE_KEYS.activeBooking);
  emitStorageEvent(STORAGE_EVENTS.sessionChanged, readSession());
}

export function readSession(): SharedSession {
  const user = getStoredUser();
  const token = getToken();
  return {
    token,
    user: user ? normalizeUser(user) : null,
    backend: getActiveBackend(),
  };
}

export function getActiveBackend(): 'express' | 'fastapi' {
  const stored = readRaw(STORAGE_KEYS.activeBackend);
  return stored === 'fastapi' ? 'fastapi' : 'express';
}

export function setActiveBackend(backend: 'express' | 'fastapi'): void {
  writeRaw(STORAGE_KEYS.activeBackend, backend);
  emitStorageEvent(STORAGE_EVENTS.backendChanged, backend);
}

export function readSearchFilters(): SharedSearchFilters {
  return safeParse<SharedSearchFilters>(readRaw(STORAGE_KEYS.searchFilters)) ?? {};
}

export function saveSearchFilters(filters: SharedSearchFilters): void {
  const payload: SharedSearchFilters = {
    ...filters,
    updatedAt: new Date().toISOString(),
  };
  writeRaw(STORAGE_KEYS.searchFilters, JSON.stringify(payload));
  emitStorageEvent(STORAGE_EVENTS.searchChanged, payload);
}

export function readCachedBookings(): Booking[] {
  return safeParse<Booking[]>(readRaw(STORAGE_KEYS.bookings)) ?? [];
}

export function saveCachedBookings(bookings: Booking[]): void {
  writeRaw(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  emitStorageEvent(STORAGE_EVENTS.bookingsChanged, bookings);
}

export function onSharedStorageChange(
  eventName: string,
  handler: (detail: unknown) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event: Event) => handler((event as CustomEvent).detail);
  const storageListener = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.activeBackend && event.newValue) {
      handler(event.newValue);
    }
    if (event.key === STORAGE_KEYS.user || event.key === STORAGE_KEYS.token) {
      handler(readSession());
    }
  };
  window.addEventListener(eventName, listener);
  window.addEventListener('storage', storageListener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener('storage', storageListener);
  };
}
