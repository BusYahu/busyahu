<script lang="ts">
  import { AlertTriangle, ArrowRightLeft } from 'lucide-svelte';
  import { BACKENDS } from '../../lib/api.js';

  type BackendId = 'express' | 'fastapi';

  interface Props {
    error: string;
    alternate: BackendId;
    onRetryAlternate: () => void;
  }

  let { error, alternate, onRetryAlternate }: Props = $props();
</script>

<div class="max-w-7xl mx-auto px-4 pb-2">
  <div class="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-200 rounded-lg px-3 py-2 text-[11px]">
    <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
    <span class="flex-1 min-w-[220px]">
      {error} Se muestran datos locales para no romper la interfaz.
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
