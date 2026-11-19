<script lang="ts">
  import { ArrowRight, Check, Clock, Coffee, Luggage, VolumeX, Wifi, Zap } from 'lucide-svelte';
  import type { TrainRoute } from '../../types';
  import type { SeatClassTier } from '../../lib/searchFilters';
  import { FARES } from '../../lib/seatClasses';

  interface Props {
    train: TrainRoute;
    currencySymbol: string;
    selectedClassTier: SeatClassTier;
    onSelect: () => void;
  }

  let { train, currencySymbol, selectedClassTier = $bindable(), onSelect }: Props = $props();

  const fares = FARES;

  const amenities = [
    { icon: Wifi, tone: 'text-indigo-600', label: 'WiFi gratuito' },
    { icon: Zap, tone: 'text-amber-500', label: 'Enchufe individual' },
    { icon: Coffee, tone: 'text-amber-700', label: 'Coche cafetería' },
    { icon: VolumeX, tone: 'text-slate-500', label: 'Coche silencioso' },
    { icon: Luggage, tone: 'text-emerald-600', label: '2 maletas incluidas' }
  ];
</script>

<div class="glass-card rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all p-5 sm:p-6">
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    <div class="space-y-4 flex-1">
      <div class="flex flex-wrap items-center gap-3">
        <span class="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md">
          {train.operator}
        </span>
        <span class="text-xs font-semibold text-slate-700">{train.trainModel}</span>
        <span class="text-xs text-slate-400 font-mono">Tren #{train.trainNumber}</span>
        <span class="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <Check class="w-3 h-3" /> {train.availableSeatsCount} asientos libres
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
        <div class="sm:col-span-4">
          <div class="text-2xl font-black text-slate-900 tabular-nums">{train.departureTime}</div>
          <div class="text-sm font-bold text-slate-800">{train.fromCity}</div>
          <div class="text-xs text-slate-500 truncate" title={train.fromStation}>{train.fromStation}</div>
        </div>

        <div class="sm:col-span-4 flex flex-col items-center justify-center text-center">
          <span class="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Clock class="w-3.5 h-3.5 text-indigo-600" />
            {train.duration}
          </span>
          <div class="w-full h-1 bg-slate-200 rounded-full my-2 relative max-w-[140px]">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-600"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
          </div>
          <span class="text-[11px] text-slate-500 font-medium">Directo sin transbordos</span>
        </div>

        <div class="sm:col-span-4 text-left sm:text-right">
          <div class="text-2xl font-black text-slate-900 tabular-nums">{train.arrivalTime}</div>
          <div class="text-sm font-bold text-slate-800">{train.toCity}</div>
          <div class="text-xs text-slate-500 truncate" title={train.toStation}>{train.toStation}</div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
        {#each amenities as amenity (amenity.label)}
          <span class="flex items-center gap-1">
            <amenity.icon class="w-3.5 h-3.5 {amenity.tone}" /> {amenity.label}
          </span>
        {/each}
      </div>
    </div>

    <div class="lg:w-72 bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between space-y-4">
      <div class="space-y-2">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
          Tarifas por viajero:
        </span>
        {#each fares as fare (fare.id)}
          <button
            type="button"
            onclick={() => (selectedClassTier = fare.id)}
            class="w-full p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors text-left {selectedClassTier ===
            fare.id
              ? 'bg-indigo-50 border border-indigo-300 font-bold text-indigo-950'
              : 'glass-card text-slate-700 hover:border-slate-300'}"
          >
            <div>
              <span class="block font-semibold">{fare.label}</span>
              <span class="text-[10px] text-slate-500 font-normal">{fare.detail}</span>
            </div>
            <div class="font-extrabold text-sm tabular-nums text-slate-900">
              {Math.round(train.basePrice * fare.multiplier)} {currencySymbol}
            </div>
          </button>
        {/each}
      </div>

      <button
        onclick={onSelect}
        class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
      >
        <span>Elegir Asiento en Vagón</span>
        <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  </div>
</div>
