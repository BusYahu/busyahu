import { useState } from 'react';
import { Activity } from 'lucide-react';
import { BACKENDS, FRONTENDS, type ApiMeta, type BackendId, type HealthMap } from '../lib/apiClient';
import { ApiFallbackBanner } from './connectivity/ApiFallbackBanner';
import {
  BackendStatusButton,
  ComplementLink,
  StorageHint,
  ToolbarButtons,
  sourceBadge,
} from './connectivity/ConnectivityParts';
import { RestContractsPanel } from './connectivity/RestContractsPanel';

interface ConnectivityHubProps {
  activeBackend: BackendId;
  health: HealthMap;
  lastResult: ApiMeta;
  loading?: boolean;
  onSwitchBackend: (backend: BackendId) => void;
  onRefresh: () => void;
  onRetryAlternate: () => void;
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
  const source = sourceBadge(lastResult, loading);

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

          {(['express', 'fastapi'] as BackendId[]).map((backend) => (
            <BackendStatusButton
              key={backend}
              backend={backend}
              activeBackend={activeBackend}
              health={health}
              onSwitchBackend={onSwitchBackend}
            />
          ))}

          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black ${source.className}`}>
            {source.label}
          </span>

          <ToolbarButtons
            loading={loading}
            onRefresh={onRefresh}
            onToggleContracts={() => setShowContracts((value) => !value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-[10px] text-slate-500 font-mono">
            {BACKENDS[activeBackend].baseUrl}
          </span>
          <ComplementLink
            url={complementary.url}
            label={complementary.label}
            port={complementary.port}
          />
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

      {showContracts && <RestContractsPanel />}

      {lastResult.error && (
        <ApiFallbackBanner
          error={lastResult.error}
          alternate={alternate}
          onRetryAlternate={onRetryAlternate}
        />
      )}

      <StorageHint />
    </section>
  );
}
