import type { User } from '../types';
import {
  BACKENDS,
  CONTRACT_ENDPOINTS,
  FRONTENDS,
  HEALTH_EVENT,
  ApiError,
  alternateBackend,
  nowIso,
  type ApiMeta,
  type ApiResult,
  type BackendConfig,
  type BackendHealth,
  type BackendId,
  type DataSource,
  type FrontendConfig,
  type HealthMap,
  type RequestOptions,
} from './api/core';
import { createAdminApi } from './api/admin';
import { createAuthApi } from './api/auth';
import { createBookingApi } from './api/bookings';
import { createCatalogApi } from './api/catalog';
import { createHealthMonitor } from './api/health';
import { createTransport, emitApiEvent } from './api/transport';
import { createMockAdapter } from './mockAdapter';
import {
  clearSession,
  getActiveBackend,
  getToken as readToken,
  onSharedStorageChange,
  readSession,
  saveSession,
  setActiveBackend,
  STORAGE_EVENTS,
} from './storage';

export type {
  ApiMeta,
  ApiResult,
  BackendConfig,
  BackendHealth,
  BackendId,
  DataSource,
  FrontendConfig,
  HealthMap,
  RequestOptions,
};
export { BACKENDS, CONTRACT_ENDPOINTS, FRONTENDS, HEALTH_EVENT, ApiError };

const mock = createMockAdapter();
const healthMonitor = createHealthMonitor();

const state: { lastResult: ApiMeta } = {
  lastResult: {
    backend: getActiveBackend(),
    source: 'mock',
    endpoint: '/',
    latencyMs: 0,
    checkedAt: nowIso(),
  },
};

const transport = createTransport({
  clientName: 'react',
  getActiveBackend,
  getHealthLatency: (backend) => healthMonitor.getSnapshot()[backend]?.latencyMs ?? 0,
  publishMeta: (meta) => {
    state.lastResult = meta;
    emitApiEvent(meta);
  },
});

const catalog = createCatalogApi(transport.request, mock, () => state.lastResult);
const auth = createAuthApi(transport.request);
const bookings = createBookingApi(transport.request, mock, catalog.getCachedDestinations);
const admin = createAdminApi(transport.request);

export const apiGateway = {
  get lastResult(): ApiMeta {
    return state.lastResult;
  },
  getActiveBackend(): BackendId {
    return getActiveBackend();
  },
  switchBackend(backend: BackendId): BackendId {
    setActiveBackend(backend);
    state.lastResult = { ...state.lastResult, backend, checkedAt: nowIso() };
    return backend;
  },
  getBackendConfig(backend: BackendId = getActiveBackend()): BackendConfig {
    return BACKENDS[backend];
  },
  getFrontends(): FrontendConfig[] {
    return [FRONTENDS.react, FRONTENDS.svelte];
  },
  getComplementaryFrontend(): FrontendConfig {
    return FRONTENDS.svelte;
  },
  getCurrentFrontend(): FrontendConfig {
    return FRONTENDS.react;
  },
  getHealthSnapshot(): HealthMap {
    return healthMonitor.getSnapshot();
  },
  getCachedDestinations: catalog.getCachedDestinations,
  getToken(): string | null {
    return readToken();
  },
  setToken(token: string): void {
    saveSession(readSession().user, token);
  },
  clearToken(): void {
    clearSession();
  },
  onBackendChanged(handler: (backend: BackendId) => void): () => void {
    return onSharedStorageChange(STORAGE_EVENTS.backendChanged, (detail) => {
      if (detail === 'express' || detail === 'fastapi') handler(detail);
    });
  },
  onSessionChanged(handler: (session: ReturnType<typeof readSession>) => void): () => void {
    return onSharedStorageChange(STORAGE_EVENTS.sessionChanged, () => handler(readSession()));
  },
  onApiEvent(handler: (meta: ApiMeta) => void): () => void {
    return onSharedStorageChange(STORAGE_EVENTS.api, (detail) => {
      if (detail && typeof detail === 'object') handler(detail as ApiMeta);
    });
  },
  checkHealth: healthMonitor.checkHealth,
  checkAllHealth: healthMonitor.checkAllHealth,
  startHealthPolling: healthMonitor.startPolling,
  getDestinations: catalog.getDestinations,
  getTrains: catalog.getTrains,
  getCatalog: catalog.getCatalog,
  getTrain: catalog.getTrain,
  getSeatMap: catalog.getSeatMap,
  searchTrains: catalog.searchTrains,
  login: auth.login,
  getProfile: auth.getProfile,
  register: auth.register,
  registerRequest: auth.registerRequest,
  verifyCode: auth.verifyCode,
  resendCode: auth.resendCode,
  createBooking: bookings.createBooking,
  getMyBookings: bookings.getMyBookings,
  getBooking: bookings.getBooking,
  cancelBooking: bookings.cancelBooking,
  generateQr: bookings.generateQr,
  sendTicketEmail: bookings.sendTicketEmail,
  createTrain: admin.createTrain,
  generatePdf: transport.generatePdf,
  getSessionUser(): User | null {
    return readSession().user;
  },
  alternateBackend,
  ApiError,
};

export type ApiGateway = typeof apiGateway;
export default apiGateway;
