<script lang="ts">
  import { ArrowLeft, Check } from 'lucide-svelte';

  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <button
    onclick={onBack}
    class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors glass-card px-3 py-1.5 rounded-xl shadow-sm"
  >
    <ArrowLeft class="w-4 h-4" />
    <span>Volver a la búsqueda de trenes</span>
  </button>

  <div class="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-500">
    <span class="text-emerald-600 flex items-center gap-1">
      <Check class="w-3.5 h-3.5" /> 1. Tren Seleccionado
    </span>
    <span>➔</span>
    <span class="text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
      2. Asiento y Pasajeros
    </span>
    <span>➔</span>
    <span class="text-slate-400">3. Billete Emitido</span>
  </div>
</div>
