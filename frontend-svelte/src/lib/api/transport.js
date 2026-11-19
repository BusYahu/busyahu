import {
  ApiError,
  BACKENDS,
  CLIENT_NAME,
  DEFAULT_TIMEOUT,
  alternateBackend,
  buildQuery,
  extractErrorMessage,
  isRetriableStatus,
  nowIso,
  serializeBody,
  unwrapPayload,
} from './core.js';
import { emitStorageEvent, getToken, STORAGE_EVENTS } from '../storage.js';

export function createTransport({ getActiveBackend, getHealthLatency, publishMeta }) {
  async function requestOnce(backend, endpoint, options) {
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
      return { data: options.normalize ? options.normalize(camelized) : camelized, latencyMs };
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

  async function request(endpoint, options = {}) {
    const active = getActiveBackend();
    const targets =
      options.retryOnAlternate === false ? [active] : [active, alternateBackend(active)];
    let lastError = null;
    let fallbackFrom;

    for (const backend of targets) {
      try {
        const result = await requestOnce(backend, endpoint, options);
        const meta = {
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
      const meta = {
        backend: active,
        source: 'mock',
        endpoint,
        latencyMs: lastError?.status === 0 ? 0 : getHealthLatency(active),
        fallbackFrom,
        error: lastError ? lastError.toUserMessage() : undefined,
        checkedAt: nowIso(),
      };
      publishMeta(meta);
      return { data: options.mock(), meta };
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
  }

  async function generatePdf(booking) {
    const active = getActiveBackend();
    const targets = [active, alternateBackend(active)];
    let lastStatus = 0;
    for (const backend of targets) {
      const token = getToken();
      const response = await fetch(`${BACKENDS[backend].baseUrl}/bookings/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/pdf',
          'X-Busyahu-Client': CLIENT_NAME,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(serializeBody(booking)),
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

  return { request, generatePdf };
}

export function emitApiEvent(meta) {
  emitStorageEvent(STORAGE_EVENTS.api, meta);
}
