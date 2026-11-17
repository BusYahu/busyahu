import { addSnakeAliases, camelizeDeep, type BackendId } from '../normalizers';
import type { Destination } from '../../types';

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

export type RequestFn = <T>(endpoint: string, options?: RequestOptions) => Promise<ApiResult<T>>;

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
export const CLIENT_NAME = 'react';
export const DEFAULT_TIMEOUT = 8000;
export const HEALTH_TIMEOUT = 2600;

export function alternateBackend(backend: BackendId): BackendId {
  return backend === 'express' ? 'fastapi' : 'express';
}

export function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function extractErrorMessage(status: number, payload: unknown): string {
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

export function isRetriableStatus(status: number): boolean {
  return status === 0 || status === 404 || status >= 500;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeDestinationsCache(raw: Destination[]): Destination[] {
  return raw;
}

export function serializeBody(body: unknown): unknown {
  return addSnakeAliases(body);
}

export function unwrapPayload(payload: unknown): unknown {
  return camelizeDeep(payload);
}
