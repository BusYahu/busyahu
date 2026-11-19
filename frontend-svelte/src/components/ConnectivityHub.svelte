<script lang="ts">
  import { Activity, Database, ExternalLink, Layers, RefreshCw } from 'lucide-svelte';
  import { BACKENDS, FRONTENDS } from '../lib/api.js';
  import BackendStatusButton from './connectivity/BackendStatusButton.svelte';
  import ContractsPanel from './connectivity/ContractsPanel.svelte';
  import FallbackBanner from './connectivity/FallbackBanner.svelte';

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

  const sourceLabel = $derived(
    lastResult?.source === 'network' ? 'API' : lastResult?.source === 'fallback' ? 'FALLBACK' : 'MOCK'
  );
  const sourceClass = $derived(
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
        <BackendStatusButton
          {backend}
          {activeBackend}
          status={health?.[backend]}
          {onSwitchBackend}
        />
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
    <ContractsPanel />
  {/if}

  {#if lastResult?.error}
    <FallbackBanner error={lastResult.error} {alternate} {onRetryAlternate} />
  {/if}

  <div class="hidden xl:flex max-w-7xl mx-auto px-4 pb-1.5 items-center gap-3 text-[9px] text-slate-500">
    <span class="flex items-center gap-1">
      <Database class="w-3 h-3" /> localStorage compartido: busyahu_token · busyahu_user · busyahu_active_backend
    </span>
  </div>
</section>
