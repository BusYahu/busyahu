import type { Booking, Destination, Passenger, TrainRoute, User } from '../types';
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
  type BackendId,
  type NormalizedSeatMap,
} from './normalizers';
import { MockAdapter } from './mockAdapter';
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
} from './storage';

export type { BackendId };

export type DataSource = 'network' | 'fallback' | 'mock';

export interface BackendConfig {
  id: BackendId;
  label: string;
  shortLabel: string;
  port: number;
  baseUrl: string;
  healthUrl: string;
  docsUrl: string;
}

export interface FrontendConfig {
  id: 'react' | 'svelte';
  label: string;
  port: number;
  url: string;
  fallbackUrl?: string;
}

export interface BackendHealth {
  backend: BackendId;
  online: boolean;
  latencyMs: number;
  checkedAt: string;
  version?: string;
  error?: string;
}

export type HealthMap = Record<BackendId, BackendHealth>;

export interface ApiMeta {
  backend: BackendId;
  source: DataSource;
  endpoint: string;
  latencyMs: number;
  fallbackFrom?: BackendId;
  error?: string;
  checkedAt: string;
}

export interface ApiResult<T> {
  data: T;
  meta: ApiMeta;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  allowMock?: boolean;
  retryOnAlternate?: boolean;
  timeoutMs?: number;
  normalize?: (raw: unknown) => unknown;
  mock?: () => unknown;
}

export class ApiError extends Error {
  status: number;
  backend: BackendId;
  endpoint: string;
  details?: unknown;
  retryable: boolean;

  constructor(options: {
    message: string;
    status: number;
    backend: BackendId;
    endpoint: string;
    details?: unknown;
    retryable?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.backend = options.backend;
    this.endpoint = options.endpoint;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
  }

  toUserMessage(): string {
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

const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) ?? {};

export const BACKENDS: Record<BackendId, BackendConfig> = {
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

export const FRONTENDS: Record<'react' | 'svelte', FrontendConfig> = {
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
] as const;

export const HEALTH_EVENT = 'busyahu:health-changed';

const CLIENT_NAME = 'react';
const DEFAULT_TIMEOUT = 8000;
const HEALTH_TIMEOUT = 2600;

function alternateBackend(backend: BackendId): BackendId {
  return backend === 'express' ? 'fastapi' : 'express';
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function extractErrorMessage(status: number, payload: unknown): string {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const detail = body.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const record = item as Record<string, unknown>;
            return String(record.msg ?? record.message ?? '');
          }
          return '';
        })
        .filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
    for (const key of ['message', 'error', 'detail']) {
      if (typeof body[key] === 'string' && String(body[key]).trim()) {
        return String(body[key]);
      }
    }
  }
  return `HTTP ${status}`;
}

function isRetriableStatus(status: number): boolean {
  return status === 0 || status === 404 || status >= 500;
}

function nowIso(): string {
  return new Date().toISOString();
}

class ApiGatewayClient {
  private mock = new MockAdapter();
  private destinationCache: Destination[] = [];
  private healthSnapshot: HealthMap;
  lastResult: ApiMeta = {
    backend: getActiveBackend(),
    source: 'mock',
    endpoint: '/',
    latencyMs: 0,
    checkedAt: nowIso(),
  };

  constructor() {
    const initialBackend = getActiveBackend();
    this.healthSnapshot = {
      express: {
        backend: 'express',
        online: false,
        latencyMs: 0,
        checkedAt: nowIso(),
      },
      fastapi: {
        backend: 'fastapi',
        online: false,
        latencyMs: 0,
        checkedAt: nowIso(),
      },
    };
    this.lastResult.backend = initialBackend;
  }

  getActiveBackend(): BackendId {
    return getActiveBackend();
  }

  switchBackend(backend: BackendId): BackendId {
    setActiveBackend(backend);
    this.lastResult = { ...this.lastResult, backend, checkedAt: nowIso() };
    return backend;
  }

  getBackendConfig(backend: BackendId = this.getActiveBackend()): BackendConfig {
    return BACKENDS[backend];
  }

  getFrontends(): FrontendConfig[] {
    return [FRONTENDS.react, FRONTENDS.svelte];
  }

  getComplementaryFrontend(): FrontendConfig {
    return FRONTENDS.svelte;
  }

  getHealthSnapshot(): HealthMap {
    return this.healthSnapshot;
  }

  getCachedDestinations(): Destination[] {
    return this.destinationCache.length ? this.destinationCache : this.mock.getDestinations();
  }

  getToken(): string | null {
    return getToken();
  }

  setToken(token: string): void {
    const session = readSession();
    saveSession(session.user, token);
  }

  clearToken(): void {
    clearSession();
  }

  onBackendChanged(handler: (backend: BackendId) => void): () => void {
    return onSharedStorageChange(STORAGE_EVENTS.backendChanged, (detail) => {
      if (detail === 'express' || detail === 'fastapi') handler(detail);
    });
  }

  onSessionChanged(handler: (session: ReturnType<typeof readSession>) => void): () => void {
    return onSharedStorageChange(STORAGE_EVENTS.sessionChanged, () => handler(readSession()));
  }

  onApiEvent(handler: (meta: ApiMeta) => void): () => void {
    return onSharedStorageChange(STORAGE_EVENTS.api, (detail) => {
      if (detail && typeof detail === 'object') handler(detail as ApiMeta);
    });
  }

  async checkHealth(backend: BackendId): Promise<BackendHealth> {
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
      let payload: Record<string, unknown> = {};
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = {};
      }
      const status = String(payload.status ?? payload.service ?? '');
      const health: BackendHealth = {
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
      const latencyMs = Math.round(performance.now() - startedAt);
      const health: BackendHealth = {
        backend,
        online: false,
        latencyMs,
        checkedAt: nowIso(),
        error: error instanceof Error ? error.message : 'Sin conexión',
      };
      this.healthSnapshot = { ...this.healthSnapshot, [backend]: health };
      return health;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async checkAllHealth(): Promise<HealthMap> {
    const [express, fastapi] = await Promise.all([
      this.checkHealth('express'),
      this.checkHealth('fastapi'),
    ]);
    const snapshot = { express, fastapi };
    this.healthSnapshot = snapshot;
    emitStorageEvent(HEALTH_EVENT, snapshot);
    return snapshot;
  }

  startHealthPolling(
    handler: (health: HealthMap) => void,
    intervalMs = 15000,
  ): () => void {
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

  private async requestOnce<T>(
    backend: BackendId,
    endpoint: string,
    options: RequestOptions,
  ): Promise<{ data: T; latencyMs: number }> {
    const config = BACKENDS[backend];
    const url = `${config.baseUrl}${endpoint}${buildQuery(options.query)}`;
    const token = getToken();
    const headers: Record<string, string> = {
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
        ? (options.normalize(camelized) as T)
        : (camelized as T);
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

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const active = this.getActiveBackend();
    const targets: BackendId[] = options.retryOnAlternate === false
      ? [active]
      : [active, alternateBackend(active)];
    let lastError: ApiError | null = null;
    let fallbackFrom: BackendId | undefined;

    for (const backend of targets) {
      try {
        const result = await this.requestOnce<T>(backend, endpoint, options);
        const meta: ApiMeta = {
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
      const mockData = options.mock() as T;
      const meta: ApiMeta = {
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
      return { data: mockData, meta };
    }

    if (lastError) {
      const meta: ApiMeta = {
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

  async getDestinations(): Promise<Destination[]> {
    const result = await this.request<Destination[]>('/destinations', {
      allowMock: true,
      mock: () => this.mock.getDestinations(),
      normalize: (raw) => normalizeDestinations(raw),
    });
    if (result.data.length) {
      this.destinationCache = result.data;
    }
    return result.data;
  }

  async getTrains(filters: Record<string, string | number | undefined> = {}): Promise<TrainRoute[]> {
    const result = await this.request<TrainRoute[]>('/trains/search', {
      query: filters,
      allowMock: true,
      mock: () => this.mock.searchTrains(filters).trains,
      normalize: (raw) => normalizeTrains(raw, this.getCachedDestinations()),
    });
    return result.data;
  }

  async getCatalog(filters: Record<string, string | number | undefined> = {}): Promise<{
    destinations: Destination[];
    trains: TrainRoute[];
    meta: ApiMeta;
  }> {
    const destinations = await this.getDestinations();
    const trains = await this.getTrains(filters);
    return {
      destinations,
      trains,
      meta: this.lastResult,
    };
  }

  async getTrain(trainId: string): Promise<TrainRoute | null> {
    const result = await this.request<TrainRoute | null>(`/trains/${encodeURIComponent(trainId)}`, {
      allowMock: true,
      mock: () => this.mock.getTrain(trainId),
      normalize: (raw) => normalizeTrains({ trains: [raw] }, this.getCachedDestinations())[0] ?? null,
    });
    return result.data;
  }

  async getSeatMap(trainId: string, date?: string): Promise<NormalizedSeatMap> {
    const result = await this.request<NormalizedSeatMap>(
      `/trains/${encodeURIComponent(trainId)}/seats`,
      {
        query: date ? { date } : undefined,
        allowMock: true,
        mock: () => this.mock.getSeatMap(trainId, date ?? new Date().toISOString().slice(0, 10)),
        normalize: (raw) => normalizeSeatMap(raw),
      },
    );
    return result.data;
  }

  async searchTrains(filters: Record<string, string | number | undefined> = {}): Promise<{
    total: number;
    trains: TrainRoute[];
  }> {
    const trains = await this.getTrains(filters);
    return { total: trains.length, trains };
  }

  async login(
    email: string,
    password: string,
    options: { persist?: boolean } = {},
  ): Promise<{ token: string; user: User | null; meta: ApiMeta }> {
    const result = await this.request<ReturnType<typeof normalizeAuthResponse>>('/auth/login', {
      method: 'POST',
      body: { email, password },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (options.persist !== false && result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async getProfile(): Promise<User | null> {
    const result = await this.request<User | null>('/auth/me', {
      normalize: (raw) => {
        const body = (raw ?? {}) as Record<string, unknown>;
        const nested = (body.user ?? body) as Record<string, unknown>;
        return normalizeAuthResponse({ user: nested }).user;
      },
    });
    return result.data;
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }): Promise<{ token: string; user: User | null; meta: ApiMeta }> {
    const result = await this.request<ReturnType<typeof normalizeAuthResponse>>('/auth/register', {
      method: 'POST',
      body: payload,
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async registerRequest(payload: {
    name: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }): Promise<{
    success: boolean;
    message: string;
    debugCode?: string;
    requiresVerification: boolean;
    token?: string;
    user?: User | null;
    meta: ApiMeta;
  }> {
    try {
      const result = await this.request<Record<string, unknown>>('/auth/register-request', {
        method: 'POST',
        body: payload,
        normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
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

  async verifyCode(
    email: string,
    code: string,
  ): Promise<{ token: string; user: User | null; meta: ApiMeta }> {
    const result = await this.request<ReturnType<typeof normalizeAuthResponse>>('/auth/verify-code', {
      method: 'POST',
      body: { email, code },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async resendCode(email: string): Promise<{ success: boolean; message: string; debugCode?: string }> {
    const result = await this.request<Record<string, unknown>>('/auth/resend-code', {
      method: 'POST',
      body: { email },
    });
    return {
      success: Boolean(result.data.success ?? true),
      message: String(result.data.message ?? 'Código reenviado.'),
      debugCode: result.data.debugCode ? String(result.data.debugCode) : undefined,
    };
  }

  async createBooking(payload: {
    trainId?: string;
    train?: TrainRoute;
    travelDate: string;
    passengers: Passenger[];
    totalPrice: number;
    currency?: string;
    userEmail?: string;
  }): Promise<Booking> {
    // El backend FastAPI valida `train` como TrainSummary; enviamos solo `trainId`
    // y usamos el objeto de dominio únicamente para normalizar la respuesta/mock.
    const { train: _domainTrain, ...outbound } = payload;
    const body = {
      ...outbound,
      seats: payload.passengers.map((passenger) => passenger.seatId),
      passengers: payload.passengers.map((passenger) => ({
        ...passenger,
        seatClass: canonicalSeatClass(passenger.seatClass),
      })),
    };
    const result = await this.request<Booking>('/bookings', {
      method: 'POST',
      body,
      allowMock: true,
      mock: () => this.mock.createBooking({ ...body, passengers: payload.passengers }),
      normalize: (raw) =>
        normalizeBooking(raw, this.getCachedDestinations(), payload.train ?? null),
    });
    const backend = result.meta.source === 'mock' ? 'mock' : result.meta.backend;
    const booking = { ...result.data, backend } as Booking;
    const cached = readCachedBookings();
    const withoutDuplicates = cached.filter(
      (item) => item.id !== booking.id && item.bookingCode !== booking.bookingCode,
    );
    saveCachedBookings([booking, ...withoutDuplicates]);
    return booking;
  }

  async getMyBookings(): Promise<Booking[]> {
    const result = await this.request<Booking[]>('/bookings/my-bookings', {
      allowMock: true,
      mock: () => this.mock.getMyBookings(),
      normalize: (raw) => normalizeBookings(raw, this.getCachedDestinations()),
    });
    return result.data;
  }

  async getBooking(bookingId: string): Promise<Booking | null> {
    const result = await this.request<Booking | null>(
      `/bookings/${encodeURIComponent(bookingId)}`,
      {
        allowMock: true,
        mock: () => this.mock.getBooking(bookingId),
        normalize: (raw) => normalizeBooking(raw, this.getCachedDestinations()),
      },
    );
    return result.data;
  }

  async cancelBooking(bookingId: string): Promise<Booking | null> {
    const result = await this.request<Booking | null>(
      `/bookings/${encodeURIComponent(bookingId)}`,
      {
        method: 'DELETE',
        allowMock: true,
        mock: () => this.mock.cancelBooking(bookingId),
        normalize: (raw) => {
          const cached = this.mock.getBooking(bookingId);
          return normalizeBooking(raw ?? cached, this.getCachedDestinations(), cached?.train);
        },
      },
    );
    if (result.data) {
      const cached = readCachedBookings();
      saveCachedBookings(
        cached.map((booking) =>
          booking.id === result.data?.id || booking.bookingCode === result.data?.bookingCode
            ? { ...booking, status: 'cancelled' }
            : booking,
        ),
      );
    }
    return result.data;
  }

  async generateQr(payload: string): Promise<{ qrCode: string; success: boolean; message?: string }> {
    const result = await this.request<Record<string, unknown>>('/bookings/qr', {
      method: 'POST',
      body: { data: payload },
      allowMock: true,
      mock: () => ({ success: false, qrCode: '', message: 'Generación de QR no disponible sin backend.' }),
      normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
    });
    return {
      success: Boolean(result.data.success ?? Boolean(result.data.qrCode)),
      qrCode: String(result.data.qrCode ?? ''),
      message: result.data.message ? String(result.data.message) : undefined,
    };
  }

  async createTrain(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result = await this.request<Record<string, unknown>>('/trains', {
      method: 'POST',
      body: payload,
      normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
    });
    return result.data;
  }

  async sendTicketEmail(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result = await this.request<Record<string, unknown>>('/bookings/send-direct-email', {
      method: 'POST',
      body: payload,
      normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
    });
    return result.data;
  }

  async generatePdf(booking: Booking): Promise<Blob> {
    const response = await fetch(`${BACKENDS[this.getActiveBackend()].baseUrl}/bookings/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
        'X-Busyahu-Client': CLIENT_NAME,
      },
      body: JSON.stringify(addSnakeAliases(booking)),
    });
    if (!response.ok) {
      throw new ApiError({
        message: extractErrorMessage(response.status, await response.text()),
        status: response.status,
        backend: this.getActiveBackend(),
        endpoint: '/bookings/generate-pdf',
      });
    }
    return response.blob();
  }

  getSessionUser(): User | null {
    return readSession().user;
  }

  getCurrentFrontend(): FrontendConfig {
    return FRONTENDS.react;
  }
}

export const apiGateway = new ApiGatewayClient();
export default apiGateway;
