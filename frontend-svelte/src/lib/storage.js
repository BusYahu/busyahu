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
};

export const STORAGE_EVENTS = {
  backendChanged: 'busyahu:backend-changed',
  sessionChanged: 'busyahu:session-changed',
  searchChanged: 'busyahu:search-changed',
  bookingsChanged: 'busyahu:bookings-changed',
  api: 'busyahu:api-event',
};

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readRaw(key) {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

export function writeRaw(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, value);
}

export function removeRaw(key) {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}

export function emitStorageEvent(name, detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function normalizeUser(raw) {
  if (!raw) return null;
  const role = raw.role === 'admin' ? 'admin' : 'client';
  return {
    ...raw,
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    role,
  };
}

export function getToken() {
  const token = readRaw(STORAGE_KEYS.token);
  if (token) return token;
  // Compatibilidad con versiones anteriores que sólo guardaban el token
  // dentro del objeto 'busyahu_user'.
  const user = safeParse(readRaw(STORAGE_KEYS.user));
  return user?.token ?? null;
}

export function getStoredUser() {
  return safeParse(readRaw(STORAGE_KEYS.user));
}

export function saveSession(user, token) {
  if (token) {
    writeRaw(STORAGE_KEYS.token, token);
  }
  if (user) {
    const normalized = normalizeUser(user);
    if (!normalized) return;
    writeRaw(
      STORAGE_KEYS.user,
      JSON.stringify({ ...normalized, token: token ?? getToken() ?? undefined }),
    );
  }
  emitStorageEvent(STORAGE_EVENTS.sessionChanged, readSession());
}

export function clearSession() {
  removeRaw(STORAGE_KEYS.token);
  removeRaw(STORAGE_KEYS.user);
  removeRaw(STORAGE_KEYS.activeBooking);
  emitStorageEvent(STORAGE_EVENTS.sessionChanged, readSession());
}

export function readSession() {
  const user = getStoredUser();
  const token = getToken();
  return {
    token,
    user: user ? normalizeUser(user) : null,
    backend: getActiveBackend(),
  };
}

export function getActiveBackend() {
  const stored = readRaw(STORAGE_KEYS.activeBackend);
  return stored === 'fastapi' ? 'fastapi' : 'express';
}

export function setActiveBackend(backend) {
  writeRaw(STORAGE_KEYS.activeBackend, backend);
  emitStorageEvent(STORAGE_EVENTS.backendChanged, backend);
}

export function readSearchFilters() {
  return safeParse(readRaw(STORAGE_KEYS.searchFilters)) ?? {};
}

export function saveSearchFilters(filters) {
  const payload = { ...filters, updatedAt: new Date().toISOString() };
  writeRaw(STORAGE_KEYS.searchFilters, JSON.stringify(payload));
  emitStorageEvent(STORAGE_EVENTS.searchChanged, payload);
}

export function readCachedBookings() {
  return safeParse(readRaw(STORAGE_KEYS.bookings)) ?? [];
}

export function saveCachedBookings(bookings) {
  writeRaw(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  emitStorageEvent(STORAGE_EVENTS.bookingsChanged, bookings);
}

export function readActiveBooking() {
  return safeParse(readRaw(STORAGE_KEYS.activeBooking));
}

export function saveActiveBooking(booking) {
  if (!booking) {
    removeRaw(STORAGE_KEYS.activeBooking);
    return;
  }
  writeRaw(STORAGE_KEYS.activeBooking, JSON.stringify(booking));
}

export function getEnvironment() {
  return readRaw(STORAGE_KEYS.environment) === 'svelte' ? 'svelte' : 'react';
}

export function setEnvironment(environment) {
  writeRaw(STORAGE_KEYS.environment, environment);
}

export function onSharedStorageChange(eventName, handler) {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event) => handler(event.detail);
  const storageListener = (event) => {
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
