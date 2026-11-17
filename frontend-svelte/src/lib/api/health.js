import { BACKENDS, HEALTH_EVENT, HEALTH_TIMEOUT, nowIso } from './core.js';
import { emitStorageEvent } from '../storage.js';

function initialHealth() {
  return {
    express: { backend: 'express', online: false, latencyMs: 0, checkedAt: nowIso() },
    fastapi: { backend: 'fastapi', online: false, latencyMs: 0, checkedAt: nowIso() },
  };
}

export function createHealthMonitor() {
  let snapshot = initialHealth();

  async function checkHealth(backend) {
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
      snapshot = { ...snapshot, [backend]: health };
      return health;
    } catch (error) {
      const health = {
        backend,
        online: false,
        latencyMs: Math.round(performance.now() - startedAt),
        checkedAt: nowIso(),
        error: error instanceof Error ? error.message : 'Sin conexión',
      };
      snapshot = { ...snapshot, [backend]: health };
      return health;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function checkAllHealth() {
    const [express, fastapi] = await Promise.all([
      checkHealth('express'),
      checkHealth('fastapi'),
    ]);
    snapshot = { express, fastapi };
    emitStorageEvent(HEALTH_EVENT, snapshot);
    return snapshot;
  }

  function startPolling(handler, intervalMs = 15000) {
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
