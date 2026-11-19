import { Database, ExternalLink, Layers, RefreshCw, Wifi, WifiOff, Server } from 'lucide-react';
import { BACKENDS, type ApiMeta, type BackendId, type HealthMap } from '../../lib/apiClient';

interface BackendStatusButtonProps {
  backend: BackendId;
  activeBackend: BackendId;
  health: HealthMap;
  onSwitchBackend: (backend: BackendId) => void;
}

export function BackendStatusButton({
  backend,
  activeBackend,
  health,
  onSwitchBackend,
}: BackendStatusButtonProps) {
  const status = health[backend];
  const isActive = activeBackend === backend;
  const accent =
    backend === 'express'
      ? {
          active: 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm',
          icon: 'text-emerald-400',
        }
      : {
          active: 'bg-sky-500/15 border-sky-500/60 text-white shadow-sm',
          icon: 'text-sky-400',
        };

  return (
    <button
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
}

interface ToolbarButtonsProps {
  loading: boolean;
  onRefresh: () => void;
  onToggleContracts: () => void;
}

export function ToolbarButtons({ loading, onRefresh, onToggleContracts }: ToolbarButtonsProps) {
  return (
    <>
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
        onClick={onToggleContracts}
        className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
        title="Ver rutas REST verificadas en ambos backends"
      >
        <Layers className="w-3 h-3 text-indigo-400" />
        <span>Contratos REST</span>
      </button>
    </>
  );
}

export function ComplementLink({ url, label, port }: { url: string; label: string; port: number }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 font-bold transition-colors"
      title={`Abrir el frontend complementario (${url})`}
    >
      <span>
        Front {label} :{port}
      </span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function StorageHint() {
  return (
    <div className="hidden xl:flex max-w-7xl mx-auto px-4 pb-1.5 items-center gap-3 text-[9px] text-slate-500">
      <span className="flex items-center gap-1">
        <Database className="w-3 h-3" /> localStorage compartido: busyahu_token · busyahu_user ·
        busyahu_active_backend
      </span>
    </div>
  );
}

export function sourceBadge(lastResult: ApiMeta, loading: boolean) {
  const label =
    lastResult.source === 'network' ? 'API' : lastResult.source === 'fallback' ? 'FALLBACK' : 'MOCK';
  const className =
    lastResult.source === 'network'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : lastResult.source === 'fallback'
        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return { label: loading ? 'SYNC…' : label, className };
}
