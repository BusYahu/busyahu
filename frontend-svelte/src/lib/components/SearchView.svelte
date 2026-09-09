<script>
  import { search, destinations, nav } from '../stores.js';
  import { Search, Train, Clock, ArrowRight, Loader2 } from 'lucide-svelte';
  import { get } from 'svelte/store';
  import { onDestroy } from 'svelte';

  let country = '';
  let from = '';
  let to = '';
  let date = new Date().toISOString().split('T')[0];

  // Get initial value and subscribe to changes
  let destinationsList = get(destinations).destinations;
  const unsubscribe = destinations.subscribe(value => {
    destinationsList = value.destinations;
  });

  onDestroy(unsubscribe);

  // Helper: adapts to both API formats (countryName/country, symbol/currencySymbol, stations/cities)
  const getCountryName = (d) => d?.countryName || d?.country || '';
  const getCountrySymbol = (d) => d?.symbol || d?.currencySymbol || '€';
  const getStations = (d) => d?.stations || d?.cities || [];

  // Station identifier: prefer id, then station name, then name
  const getStationId = (s) => s?.id || s?.station || s?.name || '';

  $: selectedCountry = destinationsList.find(d => d.countryCode === country);
  $: stations = getStations(selectedCountry);
  $: if (selectedCountry) console.log('[SearchView] Selected country:', selectedCountry.countryName, '| Stations:', stations.length);

  // Symmetric exclusion:
  // Origin shows all stations except the chosen destination
  $: originStations = stations.filter(s => getStationId(s) !== to);
  // Destination shows all stations except the chosen origin
  $: destinationStations = stations.filter(s => getStationId(s) !== from);

  // If a value ends up selected in both (e.g., country changed), clear the other
  function handleOriginChange() {
    if (to === from) to = '';
  }

  function handleDestinationChange() {
    if (from === to) from = '';
  }

  function handleSearch() {
    console.log('[SearchView] Searching with:', { country, from, to, date });
    search.search({ country, from, to, date });
  }

  function selectTrain(train) {
    nav.navigate('seats', { train, date });
  }

  function formatPrice(price, symbol) {
    return `${symbol || '€'}${price.toFixed(2)}`;
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <!-- Search Form -->
  <div class="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
    <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
      <Search class="w-6 h-6 text-emerald-400" />
      Buscar Trayectos
    </h2>

    <form on:submit|preventDefault={handleSearch} class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Country -->
      <div>
        <label for="country" class="block text-sm font-medium text-slate-300 mb-1">
          País
        </label>
        <select
          id="country"
          bind:value={country}
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todos los países</option>
          {#each destinationsList as dest}
            <option value={dest.countryCode}>{getCountryName(dest)} ({getCountrySymbol(dest)})</option>
          {/each}
        </select>
      </div>

      <!-- Origin -->
      <div>
        <label for="from" class="block text-sm font-medium text-slate-300 mb-1">
          Origen
        </label>
        <select
          id="from"
          bind:value={from}
          disabled={!country}
          on:change={handleOriginChange}
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          <option value="">Seleccionar estación</option>
          {#each originStations as station}
            <option value={getStationId(station)}>{station.station || station.name || ''}</option>
          {/each}
        </select>
      </div>

      <!-- Destination -->
      <div>
        <label for="to" class="block text-sm font-medium text-slate-300 mb-1">
          Destino
        </label>
        <select
          id="to"
          bind:value={to}
          disabled={!country}
          on:change={handleDestinationChange}
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          <option value="">Seleccionar estación</option>
          {#each destinationStations as station}
            <option value={getStationId(station)}>{station.station || station.name || ''}</option>
          {/each}
        </select>
      </div>

      <!-- Date -->
      <div>
        <label for="date" class="block text-sm font-medium text-slate-300 mb-1">
          Fecha
        </label>
        <input
          id="date"
          type="date"
          bind:value={date}
          min={new Date().toISOString().split('T')[0]}
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <!-- Search Button -->
      <div class="md:col-span-2 lg:col-span-4">
        <button
          type="submit"
          disabled={$search.loading}
          class="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {#if $search.loading}
            <Loader2 class="w-5 h-5 animate-spin" />
          {:else}
            <Search class="w-5 h-5" />
          {/if}
          Buscar Trenes
        </button>
      </div>
    </form>
  </div>

  <!-- Error -->
  {#if $search.error}
    <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
      <p class="text-red-400">{$search.error}</p>
    </div>
  {/if}

  <!-- Results -->
  {#if $search.results.length > 0}
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-slate-300">
        {$search.total} tren{#if $search.total !== 1}es{/if} encontrado{$search.total !== 1 ? 's' : ''}
      </h3>
    </div>

    <div class="space-y-4">
      {#each $search.results as train}
        <button
          class="w-full text-left bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-5 transition-all group"
          on:click={() => selectTrain(train)}
        >
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <!-- Train Info -->
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <Train class="w-5 h-5 text-emerald-400" />
                <span class="font-bold text-white">{train.name}</span>
                <span class="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
                  {train.code}
                </span>
                <span class="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  {train.type}
                </span>
              </div>

              <div class="flex items-center gap-3 text-slate-400">
                <span class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  {train.departureTime}
                </span>
                <ArrowRight class="w-4 h-4" />
                <span>{train.arrivalTime}</span>
                <span class="text-slate-500">({train.duration})</span>
              </div>
            </div>

            <!-- Price -->
            <div class="text-right">
              <div class="text-2xl font-bold text-emerald-400">
                {formatPrice(train.basePrice, getCountrySymbol(selectedCountry))}
              </div>
              <div class="text-sm text-slate-400">por asiento</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-sm text-slate-400">
            <span>{train.carriagesCount} vagones</span>
            <span class="text-emerald-400 group-hover:text-emerald-300 font-medium">
              Seleccionar →
            </span>
          </div>
        </button>
      {/each}
    </div>
  {:else if !$search.loading && $search.results.length === 0 && $search.filters.country}
    <div class="text-center py-12">
      <Train class="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p class="text-slate-400">No se encontraron trenes con los filtros seleccionados</p>
    </div>
  {/if}
</div>
