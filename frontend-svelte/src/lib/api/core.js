// Configuración y utilidades compartidas por los servicios de API.
import { addSnakeAliases, camelizeDeep } from '../normalizers.js';

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
export const CLIENT_NAME = 'svelte';
export const DEFAULT_TIMEOUT = 8000;
export const HEALTH_TIMEOUT = 2600;

export function alternateBackend(backend) {
  return backend === 'express' ? 'fastapi' : 'express';
}

export function buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function extractErrorMessage(status, payload) {
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

export function isRetriableStatus(status) {
  return status === 0 || status === 404 || status >= 500;
}

export function nowIso() {
  return new Date().toISOString();
}

export function serializeBody(body) {
  return addSnakeAliases(body);
}

export function unwrapPayload(payload) {
  return camelizeDeep(payload);
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
