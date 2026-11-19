<script lang="ts">
  import { Server, Wifi, WifiOff } from 'lucide-svelte';
  import { BACKENDS } from '../../lib/api.js';

  type BackendId = 'express' | 'fastapi';

  interface Props {
    backend: BackendId;
    activeBackend: BackendId;
    status: { online?: boolean; latencyMs?: number } | undefined;
    onSwitchBackend: (backend: BackendId) => void;
  }

  let { backend, activeBackend, status, onSwitchBackend }: Props = $props();

  const isActive = $derived(activeBackend === backend);
  const activeClass = $derived(
    backend === 'express'
      ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm'
      : 'bg-sky-500/15 border-sky-500/60 text-white shadow-sm'
  );
  const iconClass = $derived(
    isActive ? (backend === 'express' ? 'text-emerald-400' : 'text-sky-400') : 'text-slate-500'
  );
</script>

<button
  type="button"
  onclick={() => onSwitchBackend(backend)}
  title={`Conmutar en caliente hacia ${BACKENDS[backend].label}`}
  class="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-semibold transition-all {isActive
    ? activeClass
    : 'bg-slate-950/60 border-slate-700 text-slate-300 hover:border-slate-500'}"
>
  <Server class="w-3.5 h-3.5 {iconClass}" />
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
