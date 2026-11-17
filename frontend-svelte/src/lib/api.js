// Fachada del gateway de API: compone servicios por dominio y conserva la
// interfaz histórica usada por las vistas Svelte.
import {
  BACKENDS,
  CONTRACT_ENDPOINTS,
  FRONTENDS,
  HEALTH_EVENT,
  ApiError,
  alternateBackend,
  nowIso,
} from './api/core.js';
import { createAdminApi } from './api/admin.js';
import { createAuthApi } from './api/auth.js';
import { createBookingApi } from './api/bookings.js';
import { createCatalogApi } from './api/catalog.js';
import { createHealthMonitor } from './api/health.js';
import { createTransport, emitApiEvent } from './api/transport.js';
import { createMockAdapter } from './mockAdapter.js';
import {
  clearSession,
  getActiveBackend,
  getToken as readToken,
  onSharedStorageChange,
  readSession,
  saveSession,
  setActiveBackend,
  STORAGE_EVENTS,
} from './storage.js';

export { BACKENDS, CONTRACT_ENDPOINTS, FRONTENDS, HEALTH_EVENT, ApiError, alternateBackend };

const mock = createMockAdapter();
const healthMonitor = createHealthMonitor();

const state = {
  lastResult: {
    backend: getActiveBackend(),
    source: 'mock',
    endpoint: '/',
    latencyMs: 0,
    checkedAt: nowIso(),
  },
};

const transport = createTransport({
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
  get lastResult() {
    return state.lastResult;
  },
  getActiveBackend() {
    return getActiveBackend();
  },
  switchBackend(backend) {
    setActiveBackend(backend);
    state.lastResult = { ...state.lastResult, backend, checkedAt: nowIso() };
    return backend;
  },
  getBackendConfig(backend = getActiveBackend()) {
    return BACKENDS[backend];
  },
  getFrontends() {
    return [FRONTENDS.react, FRONTENDS.svelte];
  },
  getComplementaryFrontend() {
    return FRONTENDS.react;
  },
  getCurrentFrontend() {
    return FRONTENDS.svelte;
  },
  getHealthSnapshot() {
    return healthMonitor.getSnapshot();
  },
  getCachedDestinations: catalog.getCachedDestinations,
  getToken() {
    return readToken();
  },
  setToken(token) {
    saveSession(readSession().user, token);
  },
  clearToken() {
    clearSession();
  },
  onBackendChanged(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.backendChanged, (detail) => {
      if (detail === 'express' || detail === 'fastapi') handler(detail);
    });
  },
  onSessionChanged(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.sessionChanged, () => handler(readSession()));
  },
  onApiEvent(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.api, (detail) => {
      if (detail && typeof detail === 'object') handler(detail);
    });
  },
  onSearchChanged(handler) {
    return onSharedStorageChange(STORAGE_EVENTS.searchChanged, handler);
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
  generateWallet: bookings.generateWallet,
  createTrain: admin.createTrain,
  generatePdf: transport.generatePdf,
  getSessionUser() {
    return readSession().user;
  },
};

export const api = apiGateway;
export default apiGateway;
