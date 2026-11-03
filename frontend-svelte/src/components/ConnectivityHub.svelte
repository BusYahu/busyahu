<script lang="ts">
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
    WifiOff
  } from 'lucide-svelte';
  import { BACKENDS, CONTRACT_ENDPOINTS, FRONTENDS } from '../lib/api.js';

  type BackendId = 'express' | 'fastapi';

  interface Props {
    activeBackend: BackendId;
    health: any;
    lastResult: any;
    loading?: boolean;
    onSwitchBackend: (backend: BackendId) => void;
    onRefresh: () => void;
    onRetryAlternate: () => void;
  }

  let {
    activeBackend,
    health,
    lastResult,
    loading = false,
    onSwitchBackend,
    onRefresh,
    onRetryAlternate
  }: Props = $props();

  let showContracts = $state(false);
  const complementary = FRONTENDS.react;
  const backends: BackendId[] = ['express', 'fastapi'];
  const alternate = $derived<BackendId>(activeBackend === 'express' ? 'fastapi' : 'express');

  let sourceLabel = $derived(
    lastResult?.source === 'network' ? 'API' : lastResult?.source === 'fallback' ? 'FALLBACK' : 'MOCK'
  );
  let sourceClass = $derived(
    lastResult?.source === 'network'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : lastResult?.source === 'fallback'
        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  );
</script>

<section
  aria-label="Panel de interoperabilidad y conectividad"
  class="bg-slate-900/95 text-slate-200 border-b border-slate-800"
>
  <div class="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
    <div class="flex flex-wrap items-center gap-2">
      <span class="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wide text-[10px]">
        <Activity class="w-3.5 h-3.5 text-indigo-400" />
        API Gateway
      </span>

      {#each backends as backend (backend)}
        {@const status = health?.[backend]}
        {@const isActive = activeBackend === backend}
        <button
          type="button"
          onclick={() => onSwitchBackend(backend)}
          title={`Conmutar en caliente hacia ${BACKENDS[backend].label}`}
          class="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-semibold transition-all {isActive
            ? backend === 'express'
              ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm'
              : 'bg-sky-500/15 border-sky-500/60 text-white shadow-sm'
            : 'bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-500'}"
        >
          <Server
            class="w-3.5 h-3.5 {isActive
              ? backend === 'express'
                ? 'text-emerald-400'
                : 'text-sky-400'
              : 'text-slate-500'}"
          />
          <span>{BACKENDS[backend].shortLabel} :{BACKENDS[backend].port}</span>
          <span
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black {status?.online
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}"
          >
            {#if status?.online}
              <Wifi class="w-2.5 h-2.5" />
              ONLINE
            {:else}
              <WifiOff class="w-2.5 h-2.5" />
              OFFLINE
            {/if}
          </span>
          {#if status?.online}
            <span class="font-mono text-[9px] text-slate-500">{status.latencyMs}ms</span>
          {/if}
        </button>
      {/each}

      <span class="px-2 py-0.5 rounded-full border text-[9px] font-black {sourceClass}">
        {loading ? 'SYNC…' : sourceLabel}
      </span>

      <button
        type="button"
        onclick={onRefresh}
        class="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
        title="Volver a consultar ambos health-checks y recargar el catálogo"
      >
        <RefreshCw class="w-3 h-3 {loading ? 'animate-spin' : ''}" />
        <span>Actualizar</span>
      </button>

      <button
        type="button"
        onclick={() => (showContracts = !showContracts)}
        class="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
        title="Ver rutas REST verificadas en ambos backends"
      >
        <Layers class="w-3 h-3 text-indigo-400" />
        <span>Contratos REST</span>
      </button>
    </div>

    <div class="flex items-center gap-2">
      <span class="hidden md:inline text-[10px] text-slate-500 font-mono">
        {BACKENDS[activeBackend].baseUrl}
      </span>
      <a
        href={complementary.url}
        target="_blank"
        rel="noreferrer"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 font-bold transition-colors"
        title={`Abrir el frontend complementario (${complementary.url})`}
      >
        <span>Front {complementary.label} :{complementary.port}</span>
        <ExternalLink class="w-3 h-3" />
      </a>
      {#if complementary.fallbackUrl}
        <a
          href={complementary.fallbackUrl}
          target="_blank"
          rel="noreferrer"
          class="hidden lg:inline text-[10px] text-slate-500 hover:text-slate-300 underline"
          title="Puerto alternativo del frontend complementario"
        >
          o :5000
        </a>
      {/if}
    </div>
  </div>

  {#if showContracts}
    <div class="max-w-7xl mx-auto px-4 pb-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {#each CONTRACT_ENDPOINTS as contract (contract.method + contract.path)}
          <div class="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2">
            <span class="font-mono text-[9px] font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
              {contract.method}
            </span>
            <div class="min-w-0">
              <div class="font-mono text-[10px] text-slate-200 truncate">{contract.path}</div>
              <div class="text-[9px] text-slate-500 truncate">{contract.label}</div>
            </div>
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if lastResult?.error}
    <div class="max-w-7xl mx-auto px-4 pb-2">
      <div class="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-200 rounded-lg px-3 py-2 text-[11px]">
        <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
        <span class="flex-1 min-w-[220px]">
          {lastResult.error} Se muestran datos locales para no romper la interfaz.
        </span>
        <button
          type="button"
          onclick={onRetryAlternate}
          class="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400 text-slate-950 font-bold hover:bg-amber-300"
        >
          <ArrowRightLeft class="w-3 h-3" />
          Reintentar en {BACKENDS[alternate].shortLabel}
        </button>
      </div>
    </div>
  {/if}

  <div class="hidden xl:flex max-w-7xl mx-auto px-4 pb-1.5 items-center gap-3 text-[9px] text-slate-500">
    <span class="flex items-center gap-1">
      <Database class="w-3 h-3" /> localStorage compartido: busyahu_token · busyahu_user · busyahu_active_backend
    </span>
  </div>
</section>
