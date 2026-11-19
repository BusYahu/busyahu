<script lang="ts">
  import type { Destination } from '../../types';
  import type { SortBy, TimeFilter } from '../../lib/searchFilters';

  interface Props {
    destination?: Destination;
    travelDate: string;
    passengerCount: number;
    fromCity: string;
    toCity: string;
    timeFilter: TimeFilter;
    sortBy: SortBy;
  }

  let {
    destination,
    travelDate,
    passengerCount,
    fromCity,
    toCity,
    timeFilter = $bindable(),
    sortBy = $bindable()
  }: Props = $props();

  const timeOptions: Array<{ id: TimeFilter; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'morning', label: 'Mañana' },
    { id: 'afternoon', label: 'Tarde' }
  ];
</script>

<div class="glass-card p-5 rounded-2xl shadow-sm space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-xs font-bold text-slate-500">
        <span>{destination?.flagEmoji} {destination?.country}</span>
        <span>·</span>
        <span>{travelDate}</span>
        <span>·</span>
        <span>{passengerCount} {passengerCount === 1 ? 'viajero' : 'viajeros'}</span>
      </div>
      <h3 class="text-xl font-black text-slate-900 mt-0.5">
        Trenes disponibles: {fromCity} ➔ {toCity}
      </h3>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-xs">
      <span class="text-slate-500 font-medium">Horario:</span>
      <div class="flex bg-slate-100 p-1 rounded-lg">
        {#each timeOptions as option (option.id)}
          <button
            onclick={() => (timeFilter = option.id)}
            class="px-2.5 py-1 rounded-md font-medium transition-colors {timeFilter === option.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'}"
          >
            {option.label}
          </button>
        {/each}
      </div>

      <span class="text-slate-500 font-medium ml-2">Ordenar:</span>
      <select
        bind:value={sortBy}
        class="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
      >
        <option value="price_asc">Más económico</option>
        <option value="departure_asc">Salida más temprana</option>
        <option value="duration_asc">Más rápido</option>
      </select>
    </div>
  </div>
</div>
