import type { Booking } from '../../types';
import {
  ApiError,
  BACKENDS,
  DEFAULT_TIMEOUT,
  alternateBackend,
  buildQuery,
  extractErrorMessage,
  isRetriableStatus,
  nowIso,
  serializeBody,
  unwrapPayload,
  type ApiMeta,
  type ApiResult,
  type BackendId,
  type RequestFn,
  type RequestOptions,
} from './core';
import { emitStorageEvent, getToken, STORAGE_EVENTS } from '../storage';

export interface TransportContext {
  clientName: string;
  getActiveBackend: () => BackendId;
  getHealthLatency: (backend: BackendId) => number;
  publishMeta: (meta: ApiMeta) => void;
}

export interface Transport {
  request: RequestFn;
  generatePdf: (booking: Booking) => Promise<Blob>;
}

async function requestOnce<T>(
  backend: BackendId,
  endpoint: string,
  options: RequestOptions,
  clientName: string,
): Promise<{ data: T; latencyMs: number }> {
  const config = BACKENDS[backend];
  const url = `${config.baseUrl}${endpoint}${buildQuery(options.query)}`;
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Busyahu-Client': clientName,
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
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(serializeBody(options.body)),
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

    const camelized = unwrapPayload(rawPayload);
    const normalized = options.normalize ? (options.normalize(camelized) as T) : (camelized as T);
    return { data: normalized, latencyMs };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message =
      error instanceof DOMException && error.name === 'AbortError'
        ? 'Tiempo de espera agotado'
        : error instanceof Error
          ? error.message
          : 'Error de red';
    throw new ApiError({ message, status: 0, backend, endpoint, retryable: true });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function createTransport(context: TransportContext): Transport {
  const { clientName, getActiveBackend, getHealthLatency, publishMeta } = context;

  const request: RequestFn = async <T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResult<T>> => {
    const active = getActiveBackend();
    const targets: BackendId[] =
      options.retryOnAlternate === false ? [active] : [active, alternateBackend(active)];
    let lastError: ApiError | null = null;
    let fallbackFrom: BackendId | undefined;

    for (const backend of targets) {
      try {
        const result = await requestOnce<T>(backend, endpoint, options, clientName);
        const meta: ApiMeta = {
          backend,
          source: backend === active ? 'network' : 'fallback',
          endpoint,
          latencyMs: result.latencyMs,
          fallbackFrom: backend === active ? undefined : active,
          checkedAt: nowIso(),
        };
        publishMeta(meta);
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
        if (!apiError.retryable || backend !== active) break;
      }
    }

    if (options.allowMock && options.mock) {
      const meta: ApiMeta = {
        backend: active,
        source: 'mock',
        endpoint,
        latencyMs: lastError?.status === 0 ? 0 : getHealthLatency(active),
        fallbackFrom,
        error: lastError ? lastError.toUserMessage() : undefined,
        checkedAt: nowIso(),
      };
      publishMeta(meta);
      return { data: options.mock() as T, meta };
    }

    if (lastError) {
      publishMeta({
        backend: lastError.backend,
        source: 'network',
        endpoint,
        latencyMs: 0,
        error: lastError.toUserMessage(),
        checkedAt: nowIso(),
      });
      throw lastError;
    }

    throw new ApiError({
      message: 'No se pudo completar la solicitud.',
      status: 0,
      backend: active,
      endpoint,
      retryable: true,
    });
  };

  async function generatePdf(booking: Booking): Promise<Blob> {
    const backend = getActiveBackend();
    const response = await fetch(`${BACKENDS[backend].baseUrl}/bookings/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/pdf',
        'X-Busyahu-Client': clientName,
      },
      body: JSON.stringify(serializeBody(booking)),
    });
    if (!response.ok) {
      throw new ApiError({
        message: extractErrorMessage(response.status, await response.text()),
        status: response.status,
        backend,
        endpoint: '/bookings/generate-pdf',
      });
    }
    return response.blob();
  }

  return { request, generatePdf };
}

export function emitApiEvent(meta: ApiMeta): void {
  emitStorageEvent(STORAGE_EVENTS.api, meta);
}
