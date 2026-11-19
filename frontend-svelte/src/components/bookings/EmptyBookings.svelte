<script lang="ts">
  import { ArrowRight, Ticket } from 'lucide-svelte';

  interface Props {
    onGoToSearch: () => void;
  }

  let { onGoToSearch }: Props = $props();
</script>

<div class="glass-card rounded-3xl p-12 text-center space-y-4 shadow-sm">
  <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
    <Ticket class="w-7 h-7" />
  </div>
  <div>
    <h3 class="text-lg font-bold text-slate-900">Aún no tienes billetes emitidos</h3>
    <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
      Explora las conexiones de alta velocidad en nuestros 11 países y reserva tu primer viaje en minutos.
    </p>
  </div>
  <button
    onclick={onGoToSearch}
    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-2"
  >
    <span>Explorar Destinos y Trenes</span>
    <ArrowRight class="w-4 h-4" />
  </button>
</div>
