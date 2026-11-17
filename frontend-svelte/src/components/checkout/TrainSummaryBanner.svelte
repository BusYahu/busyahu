<script lang="ts">
  import { Clock, Train } from 'lucide-svelte';
  import type { TrainRoute } from '../../types';
  import type { SeatClassTier } from '../../lib/searchFilters';

  interface Props {
    train: TrainRoute;
    travelDate: string;
    selectedClass: SeatClassTier;
  }

  let { train, travelDate, selectedClass = $bindable() }: Props = $props();

  const classes: Array<{ id: SeatClassTier; label: string }> = [
    { id: 'tourist', label: 'Turista' },
    { id: 'first', label: 'Primera' },
    { id: 'business', label: 'Gran Clase' }
  ];
</script>

<div class="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
  <div class="space-y-1">
    <div class="flex items-center gap-2 text-xs text-indigo-300 font-mono">
      <Train class="w-4 h-4" />
      <span>{train.operator} · {train.trainModel}</span>
      <span>·</span>
      <span>Tren #{train.trainNumber}</span>
    </div>
    <h2 class="text-2xl font-black tracking-tight text-white">
      {train.fromCity} ➔ {train.toCity}
    </h2>
    <div class="flex items-center gap-4 text-xs text-slate-300 pt-1">
      <span class="flex items-center gap-1">
        <Clock class="w-3.5 h-3.5 text-indigo-400" /> Salida: {train.departureTime} · Llegada: {train.arrivalTime} ({train.duration})
      </span>
      <span>·</span>
      <span>Fecha: {travelDate}</span>
    </div>
  </div>

  <div class="bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
    <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
      Clase de Viaje:
    </div>
    <div class="flex gap-1">
      {#each classes as option (option.id)}
        <button
          type="button"
          onclick={() => (selectedClass = option.id)}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors {selectedClass === option.id
            ? 'bg-indigo-600 text-white shadow'
            : 'text-slate-300 hover:text-white'}"
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>
</div>
