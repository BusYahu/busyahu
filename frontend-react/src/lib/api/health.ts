import {
  BACKENDS,
  HEALTH_EVENT,
  HEALTH_TIMEOUT,
  nowIso,
  type BackendHealth,
  type BackendId,
  type HealthMap,
} from './core';
import { emitStorageEvent } from '../storage';

export interface HealthMonitor {
  getSnapshot: () => HealthMap;
  checkHealth: (backend: BackendId) => Promise<BackendHealth>;
  checkAllHealth: () => Promise<HealthMap>;
  startPolling: (handler: (health: HealthMap) => void, intervalMs?: number) => () => void;
}

function initialHealthMap(): HealthMap {
  const offline = (backend: BackendId): BackendHealth => ({
    backend,
    online: false,
    latencyMs: 0,
    checkedAt: nowIso(),
  });
  return { express: offline('express'), fastapi: offline('fastapi') };
}

export function createHealthMonitor(): HealthMonitor {
  let snapshot = initialHealthMap();

  async function checkHealth(backend: BackendId): Promise<BackendHealth> {
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
      snapshot = { ...snapshot, [backend]: health };
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
      snapshot = { ...snapshot, [backend]: health };
      return health;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function checkAllHealth(): Promise<HealthMap> {
    const [express, fastapi] = await Promise.all([
      checkHealth('express'),
      checkHealth('fastapi'),
    ]);
    snapshot = { express, fastapi };
    emitStorageEvent(HEALTH_EVENT, snapshot);
    return snapshot;
  }

  function startPolling(handler: (health: HealthMap) => void, intervalMs = 15000): () => void {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const next = await checkAllHealth();
      if (!stopped) handler(next);
    };
    void tick();
    const interval = window.setInterval(tick, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }

  return {
    getSnapshot: () => snapshot,
    checkHealth,
    checkAllHealth,
    startPolling,
  };
}
