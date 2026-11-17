<script lang="ts">
  import { AlertCircle, Lock } from 'lucide-svelte';
  import SeatPair from './SeatPair.svelte';

  interface Props {
    passengerCount: number;
    selectedCarriage: number;
    selectedSeats: string[];
    validationError: string | null;
    onSeatClick: (seatId: string) => void;
  }

  let {
    passengerCount,
    selectedCarriage = $bindable(),
    selectedSeats,
    validationError,
    onSeatClick
  }: Props = $props();

  const rows = [1, 2, 3, 4, 5, 6, 7, 8];
  const leftColumns = ['A', 'B'];
  const rightColumns = ['C', 'D'];
  const occupiedSeats = ['1-A', '1-B', '3-C', '3-D', '5-A', '6-C', '7-B'];
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
    <div>
      <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
        <span>Selección de Asientos en el Vagón</span>
        <span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200">
          Coche 0{selectedCarriage}
        </span>
      </h3>
      <p class="text-xs text-slate-500 mt-0.5">
        Haz clic para elegir los {passengerCount} asiento(s) deseados.
      </p>
    </div>

    <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
      <span class="text-slate-500 px-1">Coche:</span>
      {#each [2, 3, 4] as car (car)}
        <button
          type="button"
          onclick={() => (selectedCarriage = car)}
          class="px-2.5 py-1 rounded-md transition-colors {selectedCarriage === car
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}"
        >
          0{car}
        </button>
      {/each}
    </div>
  </div>

  <div class="bg-slate-100 text-slate-600 py-1.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200">
    <span>◀ Dirección de la marcha / Locomotora frente</span>
  </div>

  <div class="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 relative">
    <div class="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-3 px-4 border-b border-dashed border-slate-200">
      <span>Ventana (Lado A)</span>
      <span>Pasillo Central</span>
      <span>Ventana (Lado D)</span>
    </div>

    <div class="space-y-3 pt-4">
      {#each rows as row (row)}
        <div class="flex items-center justify-between gap-2">
          <SeatPair {row} columns={leftColumns} {selectedSeats} {occupiedSeats} {onSeatClick} />
          <div class="text-[11px] font-mono font-bold text-slate-400 w-8 text-center">Fila {row}</div>
          <SeatPair {row} columns={rightColumns} {selectedSeats} {occupiedSeats} {onSeatClick} />
        </div>
      {/each}
    </div>

    <div class="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-md bg-white border border-slate-300 shadow-sm"></div>
        <span>Disponible</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-md bg-indigo-600 border border-indigo-700 shadow-sm"></div>
        <span class="font-bold text-indigo-900">Seleccionado</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center">
          <Lock class="w-2.5 h-2.5 text-slate-400" />
        </div>
        <span>Ocupado</span>
      </div>
    </div>
  </div>

  {#if validationError}
    <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
      <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
      <span>{validationError}</span>
    </div>
  {/if}
</div>
