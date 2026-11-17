<script lang="ts">
  import { Printer, Ticket, ArrowRight } from 'lucide-svelte';

  interface Props {
    onPrint: () => void;
    onGoToMyBookings: () => void;
    onBackToSearch: () => void;
  }

  let { onPrint, onGoToMyBookings, onBackToSearch }: Props = $props();
</script>

<div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 print:hidden">
  <button
    onclick={onPrint}
    class="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-colors"
  >
    <Printer class="w-4 h-4 text-indigo-600" />
    <span>Imprimir / Descargar Billete PDF</span>
  </button>

  <button
    onclick={onGoToMyBookings}
    class="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
  >
    <Ticket class="w-4 h-4" />
    <span>Ver en Mis Billetes</span>
  </button>

  <button
    onclick={onBackToSearch}
    class="w-full sm:w-auto px-6 py-3 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
  >
    <span>Reservar otro viaje</span>
    <ArrowRight class="w-3.5 h-3.5" />
  </button>
</div>
