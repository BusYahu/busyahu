// Unified API Gateway - hot-switchable between Express (:4000) and FastAPI (:8000).
// Shared by the Svelte frontend and interoperable with the React gateway.
import {
  addSnakeAliases,
  camelizeDeep,
  canonicalSeatClass,
  normalizeAuthResponse,
  normalizeBooking,
  normalizeBookings,
  normalizeDestinations,
  normalizeSeatMap,
  normalizeTrains,
} from './normalizers.js';
import { MockAdapter } from './mockAdapter.js';
import {
  clearSession,
  emitStorageEvent,
  getActiveBackend,
  getToken,
  onSharedStorageChange,
  readCachedBookings,
  readSession,
  saveCachedBookings,
  saveSession,
  setActiveBackend,
  STORAGE_EVENTS,
} from './storage.js';

const env = import.meta.env ?? {};

export const BACKENDS = {
  express: {
    id: 'express',
    label: 'Node.js / Express',
    shortLabel: 'Express',
    port: 4000,
    baseUrl: env.VITE_EXPRESS_API_URL || 'http://localhost:4000/api',
    healthUrl: env.VITE_EXPRESS_HEALTH_URL || 'http://localhost:4000/api/health',
    docsUrl: 'http://localhost:4000/api/health',
  },
  fastapi: {
    id: 'fastapi',
    label: 'Python / FastAPI',
    shortLabel: 'FastAPI',
    port: 8000,
    baseUrl: env.VITE_FASTAPI_API_URL || 'http://localhost:8000/api',
    healthUrl: env.VITE_FASTAPI_HEALTH_URL || 'http://localhost:8000/api/health',
    docsUrl: 'http://localhost:8000/docs',
  },
};

export const FRONTENDS = {
  react: {
    id: 'react',
    label: 'React 19',
    port: 5173,
    url: env.VITE_REACT_FRONTEND_URL || 'http://localhost:5173',
  },
  svelte: {
    id: 'svelte',
    label: 'Svelte 5',
    port: 5174,
    url: env.VITE_SVELTE_FRONTEND_URL || 'http://localhost:5174',
    fallbackUrl: 'http://localhost:5000',
  },
};

export const CONTRACT_ENDPOINTS = [
  { method: 'GET', path: '/destinations', label: 'Catálogo de destinos' },
  { method: 'GET', path: '/trains', label: 'Catálogo de trenes' },
  { method: 'POST', path: '/bookings', label: 'Emisión de billetes' },
  { method: 'POST', path: '/auth/login', label: 'Autenticación compartida' },
];

export const HEALTH_EVENT = 'busyahu:health-changed';

const CLIENT_NAME = 'svelte';
const DEFAULT_TIMEOUT = 8000;
const HEALTH_TIMEOUT = 2600;

function alternateBackend(backend) {
  return backend === 'express' ? 'fastapi' : 'express';
}

function buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function extractErrorMessage(status, payload) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const detail = payload.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return String(item.msg ?? item.message ?? '');
          }
          return '';
        })
        .filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
    for (const key of ['message', 'error', 'detail']) {
      if (typeof payload[key] === 'string' && String(payload[key]).trim()) {
        return String(payload[key]);
      }
    }
  }
  return `HTTP ${status}`;
}

function isRetriableStatus(status) {
  return status === 0 || status === 404 || status >= 500;
}

function nowIso() {
  return new Date().toISOString();
}

export class ApiError extends Error {
  constructor({ message, status, backend, endpoint, details, retryable = false }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.backend = backend;
    this.endpoint = endpoint;
    this.details = details;
    this.retryable = retryable;
  }

  toUserMessage() {
    const target = this.backend === 'express' ? 'Express (:4000)' : 'FastAPI (:8000)';
    if (this.status === 0) {
      return `No se pudo conectar con ${target}. Verifica que el servicio esté encendido.`;
    }
    if (this.status === 404) {
      return `${target} no implementa todavía ${this.endpoint} (HTTP 404).`;
    }
    if (this.status >= 500) {
      return `${target} respondió con error HTTP ${this.status} en ${this.endpoint}. Puedes reintentar contra el backend alternativo.`;
    }
    return `${target} respondió HTTP ${this.status}: ${this.message}`;
  }
}

class ApiGatewayClient {
  constructor() {
    this.mock = new MockAdapter();
    this.destinationCache = [];
    this.healthSnapshot = {
      express: { backend: 'express', online: false, latencyMs: 0, checkedAt: nowIso() },
      fastapi: { backend: 'fastapi', online: false, latencyMs: 0, checkedAt: nowIso() },
    };
    this.lastResult = {
      backend: getActiveBackend(),
      source: 'mock',
      endpoint: '/',
      latencyMs: 0,
      checkedAt: nowIso(),
    };
  }

  getActiveBackend() {
    return getActiveBackend();
  }

  switchBackend(backend) {
    setActiveBackend(backend);
    this.lastResult = { ...this.lastResult, backend, checkedAt: nowIso() };
    return backend;
  }

  getBackendConfig(backend = this.getActiveBackend()) {
    return BACKENDS[backend];
  }

  getFrontends() {
    return [FRONTENDS.react, FRONTENDS.svelte];
  }

  getComplementaryFrontend() {
    return FRONTENDS.react;
  }

  getCurrentFrontend() {
    return FRONTENDS.svelte;
  }

  getHealthSnapshot() {
    return this.healthSnapshot;
  }

  getCachedDestinations() {
    return this.destinationCache.length ? this.destinationCache : this.mock.getDestinations();
  }

  getToken() {
    return getToken();
  }

  setToken(token) {
    const session = readSession();
    saveSession(session.user, token);
  }

  clearToken() {
    clearSession();
  }

  onBackendChanged(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.backendChanged, (detail) => {
      if (detail === 'express' || detail === 'fastapi') handler(detail);
    });
  }

  onSessionChanged(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.sessionChanged, () => handler(readSession()));
  }

  onApiEvent(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.api, (detail) => {
      if (detail && typeof detail === 'object') handler(detail);
    });
  }

  onSearchChanged(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.searchChanged, handler);
  }

  async checkHealth(backend) {
    const startedAt = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT);
    try {
      const response = await fetch(BACKENDS[backend].healthUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const latencyMs = Math.round(performance.now() - startedAt);
      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }
      const status = String(payload.status ?? payload.service ?? '');
      const health = {
        backend,
        online: response.ok && (status === '' || status === 'ok'),
        latencyMs,
        checkedAt: nowIso(),
        version: payload.version ? String(payload.version) : undefined,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
      this.healthSnapshot = { ...this.healthSnapshot, [backend]: health };
      return health;
    } catch (error) {
      const health = {
        backend,
        online: false,
        latencyMs: Math.round(performance.now() - startedAt),
        checkedAt: nowIso(),
        error: error instanceof Error ? error.message : 'Sin conexión',
      };
      this.healthSnapshot = { ...this.healthSnapshot, [backend]: health };
      return health;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async checkAllHealth() {
    const [express, fastapi] = await Promise.all([
      this.checkHealth('express'),
      this.checkHealth('fastapi'),
    ]);
    const snapshot = { express, fastapi };
    this.healthSnapshot = snapshot;
    emitStorageEvent(HEALTH_EVENT, snapshot);
    return snapshot;
  }

  startHealthPolling(handler, intervalMs = 15000) {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const snapshot = await this.checkAllHealth();
      if (!stopped) handler(snapshot);
    };
    void tick();
    const interval = window.setInterval(tick, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }

  async requestOnce(backend, endpoint, options) {
    const config = BACKENDS[backend];
    const url = `${config.baseUrl}${endpoint}${buildQuery(options.query)}`;
    const token = getToken();
    const headers = {
      Accept: 'application/json',
      'X-Busyahu-Client': CLIENT_NAME,
      'X-Busyahu-Backend': backend,
      ...(options.headers ?? {}),
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? DEFAULT_TIMEOUT,
    );
    const startedAt = performance.now();

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        signal: controller.signal,
        body: options.body === undefined ? undefined : JSON.stringify(addSnakeAliases(options.body)),
      });

      const latencyMs = Math.round(performance.now() - startedAt);
      const contentType = response.headers.get('content-type') ?? '';
      const rawPayload = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : await response.text();

      if (!response.ok) {
        throw new ApiError({
          message: extractErrorMessage(response.status, rawPayload),
          status: response.status,
          backend,
          endpoint,
          details: rawPayload,
          retryable: isRetriableStatus(response.status),
        });
      }

      const camelized = camelizeDeep(rawPayload);
      const normalized = options.normalize
        ? options.normalize(camelized)
        : camelized;
      return { data: normalized, latencyMs };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const message =
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Tiempo de espera agotado'
          : error instanceof Error
            ? error.message
            : 'Error de red';
      throw new ApiError({
        message,
        status: 0,
        backend,
        endpoint,
        retryable: true,
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async request(endpoint, options = {}) {
    const active = this.getActiveBackend();
    const targets = options.retryOnAlternate === false
      ? [active]
      : [active, alternateBackend(active)];
    let lastError = null;
    let fallbackFrom;

    for (const backend of targets) {
      try {
        const result = await this.requestOnce(backend, endpoint, options);
        const meta = {
          backend,
          source: backend === active ? 'network' : 'fallback',
          endpoint,
          latencyMs: result.latencyMs,
          fallbackFrom: backend === active ? undefined : active,
          checkedAt: nowIso(),
        };
        this.lastResult = meta;
        emitStorageEvent(STORAGE_EVENTS.api, meta);
        return { data: result.data, meta };
      } catch (error) {
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError({
                message: error instanceof Error ? error.message : 'Error desconocido',
                status: 0,
                backend,
                endpoint,
                retryable: true,
              });
        lastError = apiError;
        fallbackFrom = fallbackFrom ?? backend;

        if (!apiError.retryable || backend !== active) {
          break;
        }
      }
    }

    if (options.allowMock && options.mock) {
      const meta = {
        backend: active,
        source: 'mock',
        endpoint,
        latencyMs: lastError?.status === 0 ? 0 : this.healthSnapshot[active]?.latencyMs ?? 0,
        fallbackFrom,
        error: lastError ? lastError.toUserMessage() : undefined,
        checkedAt: nowIso(),
      };
      this.lastResult = meta;
      emitStorageEvent(STORAGE_EVENTS.api, meta);
      return { data: options.mock(), meta };
    }

    if (lastError) {
      const meta = {
        backend: lastError.backend,
        source: 'network',
        endpoint,
        latencyMs: 0,
        error: lastError.toUserMessage(),
        checkedAt: nowIso(),
      };
      this.lastResult = meta;
      emitStorageEvent(STORAGE_EVENTS.api, meta);
      throw lastError;
    }

    throw new ApiError({
      message: 'No se pudo completar la solicitud.',
      status: 0,
      backend: active,
      endpoint,
      retryable: true,
    });
  }

  async getDestinations() {
    const result = await this.request('/destinations', {
      allowMock: true,
      mock: () => this.mock.getDestinations(),
      normalize: (raw) => normalizeDestinations(raw),
    });
    if (result.data.length) {
      this.destinationCache = result.data;
    }
    return result.data;
  }

  resolveTrainQuery(filters = {}) {
    const query = { ...filters };
    const destinations = this.getCachedDestinations();
    const country = query.country ? String(query.country) : '';
    const selectedDestination = country
      ? destinations.find(
          (destination) =>
            destination.id === country.toLowerCase() ||
            destination.countryCode.toLowerCase() === country.toLowerCase(),
        )
      : null;

    if (selectedDestination) {
      query.country = selectedDestination.countryCode;
    }

    const stationIdForCity = (cityName) => {
      const pool = selectedDestination ? [selectedDestination] : destinations;
      for (const destination of pool) {
        const city = (destination.cities || []).find(
          (item) => item.name.toLowerCase() === String(cityName).toLowerCase(),
        );
        if (city?.stationId) return city.stationId;
      }
      return cityName;
    };

    if (query.from) query.from = stationIdForCity(query.from);
    if (query.to) query.to = stationIdForCity(query.to);
    return query;
  }

  async getTrains(filters = {}) {
    const hasFilters = Object.values(filters).some(
      (value) => value !== undefined && value !== null && value !== '',
    );
    const endpoint = hasFilters ? '/trains/search' : '/trains';
    const result = await this.request(endpoint, {
      query: hasFilters ? this.resolveTrainQuery(filters) : undefined,
      allowMock: true,
      mock: () => this.mock.searchTrains(filters).trains,
      normalize: (raw) => normalizeTrains(raw, this.getCachedDestinations()),
    });
    return result.data;
  }

  async getCatalog(filters = {}) {
    const destinations = await this.getDestinations();
    const trains = await this.getTrains(filters);
    return { destinations, trains, meta: this.lastResult };
  }

  async getTrain(trainId) {
    const result = await this.request(`/trains/${encodeURIComponent(trainId)}`, {
      allowMock: true,
      mock: () => this.mock.getTrain(trainId),
      normalize: (raw) =>
        normalizeTrains({ trains: [raw] }, this.getCachedDestinations())[0] ?? null,
    });
    return result.data;
  }

  async getSeatMap(trainId, date) {
    const result = await this.request(`/trains/${encodeURIComponent(trainId)}/seats`, {
      query: date ? { date } : undefined,
      allowMock: true,
      mock: () => this.mock.getSeatMap(trainId, date ?? new Date().toISOString().slice(0, 10)),
      normalize: (raw) => normalizeSeatMap(raw),
    });
    return result.data;
  }

  async searchTrains(filters = {}) {
    const trains = await this.getTrains(filters);
    return { total: trains.length, trains };
  }

  async login(email, password, options = {}) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (options.persist !== false && result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async getProfile() {
    const result = await this.request('/auth/me', {
      normalize: (raw) => {
        const body = raw ?? {};
        const nested = body.user ?? body;
        return normalizeAuthResponse({ user: nested }).user;
      },
    });
    return result.data;
  }

  async register(payload) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: payload,
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async registerRequest(payload) {
    try {
      const result = await this.request('/auth/register-request', {
        method: 'POST',
        body: payload,
        normalize: (raw) => raw ?? {},
      });
      return {
        success: Boolean(result.data.success ?? true),
        message: String(result.data.message ?? 'Código de verificación enviado.'),
        debugCode: result.data.debugCode ? String(result.data.debugCode) : undefined,
        requiresVerification: true,
        meta: result.meta,
      };
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 0)) {
        throw error;
      }
      // Express no implementa register-request: usamos su /auth/register.
      const registered = await this.register(payload);
      return {
        success: true,
        message: 'Cuenta creada exitosamente.',
        requiresVerification: false,
        token: registered.token,
        user: registered.user,
        meta: registered.meta,
      };
    }
  }

  async verifyCode(email, code) {
    const result = await this.request('/auth/verify-code', {
      method: 'POST',
      body: { email, code },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async resendCode(email) {
    const result = await this.request('/auth/resend-code', {
      method: 'POST',
      body: { email },
    });
    return {
      success: Boolean(result.data.success ?? true),
      message: String(result.data.message ?? 'Código reenviado.'),
      debugCode: result.data.debugCode ? String(result.data.debugCode) : undefined,
    };
  }

  async createBooking(payload) {
    const trainId = payload.trainId ?? payload.train?.id ?? '';
    const passengers = (payload.passengers ?? []).map((passenger) => ({
      ...passenger,
      seatClass: canonicalSeatClass(passenger.seatClass),
    }));
    const body = {
      trainId,
      travelDate: payload.travelDate,
      passengers,
      totalPrice: Number(payload.totalPrice ?? 0),
      currency: payload.currency ?? payload.train?.currency ?? 'EUR',
      userEmail: payload.userEmail ?? '',
      seats: passengers.map((passenger) => passenger.seatId),
    };
    const result = await this.request('/bookings', {
      method: 'POST',
      body,
      allowMock: true,
      mock: () => this.mock.createBooking({ ...body, train: payload.train ?? this.mock.getTrain(trainId) }),
      normalize: (raw) =>
        normalizeBooking(raw, this.getCachedDestinations(), payload.train ?? null),
    });
    const backend = result.meta.source === 'mock' ? 'mock' : result.meta.backend;
    const booking = { ...result.data, backend };
    const cached = readCachedBookings();
    const withoutDuplicates = cached.filter(
      (item) => item.id !== booking.id && item.bookingCode !== booking.bookingCode,
    );
    saveCachedBookings([booking, ...withoutDuplicates]);
    return booking;
  }

  async getMyBookings() {
    const result = await this.request('/bookings/my-bookings', {
      allowMock: true,
      mock: () => this.mock.getMyBookings(),
      normalize: (raw) => normalizeBookings(raw, this.getCachedDestinations()),
    });
    return result.data;
  }

  async getBooking(bookingId) {
    const result = await this.request(`/bookings/${encodeURIComponent(bookingId)}`, {
      allowMock: true,
      mock: () => this.mock.getBooking(bookingId),
      normalize: (raw) => normalizeBooking(raw, this.getCachedDestinations()),
    });
    return result.data;
  }

  async cancelBooking(bookingId) {
    const cached = this.mock.getBooking(bookingId);
    const result = await this.request(`/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      allowMock: true,
      mock: () => this.mock.cancelBooking(bookingId),
      normalize: (raw) => {
        const payload = raw && Object.keys(raw).length ? raw : {};
        return normalizeBooking(
          { ...(cached ?? {}), ...payload, status: payload.status ?? 'cancelled' },
          this.getCachedDestinations(),
          cached?.train ?? null,
        );
      },
    });
    if (result.data) {
      const stored = readCachedBookings();
      saveCachedBookings(
        stored.map((booking) =>
          booking.id === result.data?.id || booking.bookingCode === result.data?.bookingCode
            ? { ...booking, status: 'cancelled' }
            : booking,
        ),
      );
    }
    return result.data;
  }

  async generateQr(payload) {
    const result = await this.request('/bookings/qr', {
      method: 'POST',
      body: { data: payload },
      allowMock: true,
      mock: () => ({
        success: false,
        qrCode: '',
        message: 'Generación de QR no disponible sin backend.',
      }),
      normalize: (raw) => raw ?? {},
    });
    return {
      success: Boolean(result.data.success ?? Boolean(result.data.qrCode)),
      qrCode: String(result.data.qrCode ?? ''),
      message: result.data.message ? String(result.data.message) : undefined,
    };
  }

  async createTrain(payload) {
    const result = await this.request('/trains', {
      method: 'POST',
      body: payload,
      normalize: (raw) => raw ?? {},
    });
    return result.data;
  }

  async sendTicketEmail(payload) {
    const result = await this.request('/bookings/send-direct-email', {
      method: 'POST',
      body: payload,
      normalize: (raw) => raw ?? {},
    });
    return result.data;
  }

  async generateWallet(payload) {
    const result = await this.request('/bookings/generate-wallet', {
      method: 'POST',
      body: payload,
      normalize: (raw) => raw ?? {},
    });
    return result.data;
  }

  async generatePdf(booking) {
    const active = this.getActiveBackend();
    const targets = [active, alternateBackend(active)];
    let lastStatus = 0;
    for (const backend of targets) {
      const response = await fetch(`${BACKENDS[backend].baseUrl}/bookings/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/pdf',
          'X-Busyahu-Client': CLIENT_NAME,
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(addSnakeAliases(booking)),
      });
      if (response.ok) return response.blob();
      lastStatus = response.status;
      if (!isRetriableStatus(response.status)) break;
    }
    throw new ApiError({
      message: `HTTP ${lastStatus}`,
      status: lastStatus,
      backend: active,
      endpoint: '/bookings/generate-pdf',
    });
  }

  getSessionUser() {
    return readSession().user;
  }
}

export const apiGateway = new ApiGatewayClient();
export const api = apiGateway;
export default apiGateway;
