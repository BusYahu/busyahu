<script lang="ts">
  import { ArrowLeftRight, Calendar, Search } from 'lucide-svelte';
  import type { Destination } from '../../types';
  import type { SeatClassTier } from '../../lib/searchFilters';
  import CitySelect from './CitySelect.svelte';

  interface Props {
    destinations: Destination[];
    currentDestination?: Destination;
    selectedCountryId: string;
    fromCity: string;
    toCity: string;
    travelDate: string;
    passengerCount: number;
    selectedClassTier: SeatClassTier;
    onCountryChange: (countryId: string) => void;
    onSwapCities: () => void;
    onSearch: () => void;
  }

  let {
    destinations,
    currentDestination,
    selectedCountryId = $bindable(),
    fromCity = $bindable(),
    toCity = $bindable(),
    travelDate = $bindable(),
    passengerCount = $bindable(),
    selectedClassTier = $bindable(),
    onCountryChange,
    onSwapCities,
    onSearch
  }: Props = $props();
</script>

<div class="glass-card text-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl">
  <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 text-xs">
    <div class="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
      <span class="text-slate-500 font-medium whitespace-nowrap">País:</span>
      {#each destinations as destination (destination.id)}
        <button
          onclick={() => onCountryChange(destination.id)}
          class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 {selectedCountryId === destination.id
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
        >
          <span>{destination.flagEmoji}</span>
          <span>{destination.country}</span>
        </button>
      {/each}
    </div>

    <div class="flex items-center gap-2">
      <span class="text-slate-500 font-medium">Clase:</span>
      <select
        bind:value={selectedClassTier}
        class="bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="tourist">Turista (Estándar)</option>
        <option value="first">Primera (+ Confort)</option>
        <option value="business">Gran Clase (Business)</option>
      </select>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
    <CitySelect
      id="fromCity"
      label="Origen"
      tone="indigo"
      cities={currentDestination?.cities || []}
      bind:value={fromCity}
    />

    <div class="md:col-span-1 flex justify-center pb-1">
      <button
        type="button"
        onclick={onSwapCities}
        title="Intercambiar origen y destino"
        class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-sm"
      >
        <ArrowLeftRight class="w-4 h-4" />
      </button>
    </div>

    <CitySelect
      id="toCity"
      label="Destino"
      tone="emerald"
      cities={currentDestination?.cities || []}
      bind:value={toCity}
    />

    <div class="md:col-span-2">
      <label for="travelDate" class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
        Fecha de Salida
      </label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Calendar class="w-4 h-4" />
        </div>
        <input
          id="travelDate"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          bind:value={travelDate}
          class="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
      </div>
    </div>

    <div class="md:col-span-1">
      <label for="passengerCount" class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
        Viajeros
      </label>
      <div class="relative">
        <select
          id="passengerCount"
          bind:value={passengerCount}
          class="w-full py-2.5 px-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        >
          {#each [1, 2, 3, 4, 5, 6] as num (num)}
            <option value={num}>{num} {num === 1 ? 'persona' : 'personas'}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="md:col-span-2">
      <button
        type="button"
        onclick={onSearch}
        class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <Search class="w-4 h-4" />
        <span>Buscar Trenes</span>
      </button>
    </div>
  </div>
</div>
