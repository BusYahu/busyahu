import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Database,
  ExternalLink,
  Layers,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  BACKENDS,
  CONTRACT_ENDPOINTS,
  FRONTENDS,
  type ApiMeta,
  type BackendId,
  type HealthMap,
} from '../lib/apiClient';

interface ConnectivityHubProps {
  activeBackend: BackendId;
  health: HealthMap;
  lastResult: ApiMeta;
  loading?: boolean;
  onSwitchBackend: (backend: BackendId) => void;
  onRefresh: () => void;
  onRetryAlternate: () => void;
}

function backendAccent(backend: BackendId): { active: string; icon: string } {
  return backend === 'express'
    ? { active: 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm', icon: 'text-emerald-400' }
    : { active: 'bg-sky-500/15 border-sky-500/60 text-white shadow-sm', icon: 'text-sky-400' };
}

export function ConnectivityHub({
  activeBackend,
  health,
  lastResult,
  loading = false,
  onSwitchBackend,
  onRefresh,
  onRetryAlternate,
}: ConnectivityHubProps) {
  const [showContracts, setShowContracts] = useState(false);
  const complementary = FRONTENDS.svelte;
  const alternate: BackendId = activeBackend === 'express' ? 'fastapi' : 'express';
  const sourceLabel =
    lastResult.source === 'network'
      ? 'API'
      : lastResult.source === 'fallback'
        ? 'FALLBACK'
        : 'MOCK';
  const sourceClass =
    lastResult.source === 'network'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : lastResult.source === 'fallback'
        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

  return (
    <section
      aria-label="Panel de interoperabilidad y conectividad"
      className="bg-slate-900/95 text-slate-200 border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wide text-[10px]">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            API Gateway
          </span>

          {(['express', 'fastapi'] as BackendId[]).map((backend) => {
            const status = health[backend];
            const isActive = activeBackend === backend;
            const accent = backendAccent(backend);
            return (
              <button
                key={backend}
                type="button"
                onClick={() => onSwitchBackend(backend)}
                title={`Conmutar en caliente hacia ${BACKENDS[backend].label}`}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                  isActive
                    ? accent.active
                    : 'bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Server className={`w-3.5 h-3.5 ${isActive ? accent.icon : 'text-slate-500'}`} />
                <span>
                  {BACKENDS[backend].shortLabel} :{BACKENDS[backend].port}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black ${
                    status?.online
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {status?.online ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {status?.online ? 'ONLINE' : 'OFFLINE'}
                </span>
                {status?.online && (
                  <span className="font-mono text-[9px] text-slate-500">{status.latencyMs}ms</span>
                )}
              </button>
            );
          })}

          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${sourceClass}`}>
            {loading ? 'SYNC…' : sourceLabel}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Volver a consultar ambos health-checks y recargar el catálogo"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowContracts((value) => !value)}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Ver rutas REST verificadas en ambos backends"
          >
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>Contratos REST</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[10px] text-slate-500 font-mono">
            {BACKENDS[activeBackend].baseUrl}
          </span>
          <a
            href={complementary.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 font-bold transition-colors"
            title={`Abrir el frontend complementario (${complementary.url})`}
          >
            <span>Front {complementary.label} :{complementary.port}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          {complementary.fallbackUrl && (
            <a
              href={complementary.fallbackUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline text-[10px] text-slate-500 hover:text-slate-300 underline"
              title="Puerto alternativo del frontend Svelte"
            >
              o :5000
            </a>
          )}
        </div>
      </div>

      {showContracts && (
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {CONTRACT_ENDPOINTS.map((contract) => (
              <div
                key={`${contract.method}-${contract.path}`}
                className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2"
              >
                <span className="font-mono text-[9px] font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  {contract.method}
                </span>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] text-slate-200 truncate">{contract.path}</div>
                  <div className="text-[9px] text-slate-500 truncate">{contract.label}</div>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {lastResult.error && (
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-200 rounded-lg px-3 py-2 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 min-w-[220px]">
              {lastResult.error} Se muestran datos locales para no romper la interfaz.
            </span>
            <button
              type="button"
              onClick={onRetryAlternate}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400 text-slate-950 font-bold hover:bg-amber-300"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Reintentar en {BACKENDS[alternate].shortLabel}
            </button>
          </div>
        </div>
      )}

      <div className="hidden xl:flex max-w-7xl mx-auto px-4 pb-1.5 items-center gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <Database className="w-3 h-3" /> localStorage compartido: busyahu_token · busyahu_user · busyahu_active_backend
        </span>
      </div>
    </section>
  );
}
