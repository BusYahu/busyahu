<script lang="ts">
  import type { Destination, TrainRoute } from '../types';
  import { 
    Search, 
    Train, 
    Calendar, 
    MapPin, 
    Clock, 
    ArrowRight, 
    Users, 
    Sparkles
  } from 'lucide-svelte';

  interface Props {
    destinations: Destination[];
    trains: TrainRoute[];
    activeBackend: 'express' | 'fastapi';
    onSelectTrain: (train: TrainRoute, travelDate: string, passengerCount: number) => void;
    onToggleBackend: (backend: 'express' | 'fastapi') => void;
  }

  let { 
    destinations = [], 
    trains = [], 
    activeBackend = 'express', 
    onSelectTrain, 
    onToggleBackend 
  }: Props = $props();

  let selectedCountryId = $state<string>('es');
  let fromCity = $state<string>('Madrid');
  let toCity = $state<string>('Barcelona');
  let travelDate = $state<string>('2026-09-15');
  let passengerCount = $state<number>(1);
  let filterClass = $state<'all' | 'tourist' | 'first' | 'business'>('all');

  let currentDestination = $derived(
    destinations.find((d) => d.id === selectedCountryId) || destinations[0]
  );

  function handleCountryChange(countryId: string) {
    selectedCountryId = countryId;
    const dest = destinations.find((d) => d.id === countryId);
    if (dest && dest.cities.length >= 2) {
      fromCity = dest.cities[0].name;
      toCity = dest.cities[1].name;
    }
  }

  let filteredTrains = $derived(
    trains.filter((train) => {
      const matchCountry = currentDestination 
        ? train.country.toLowerCase() === currentDestination.country.toLowerCase() 
        : true;
      const matchFrom = fromCity ? train.fromCity.toLowerCase() === fromCity.toLowerCase() : true;
      const matchTo = toCity ? train.toCity.toLowerCase() === toCity.toLowerCase() : true;
      return matchCountry && matchFrom && matchTo;
    })
  );
</script>

<div id="train-search-view" class="space-y-6">
  <!-- Banner de Backend y Selección de Framework -->
  <div class="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <span class="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
          <Sparkles class="w-3.5 h-3.5" /> Motor de Búsqueda Global (Svelte 5)
        </span>
        <span class="text-slate-400 text-xs font-mono">• 11 Países Conectados</span>
      </div>
      <h2 class="text-xl sm:text-2xl font-bold tracking-tight">
        Reserva de Billetes de Tren Internacionales
      </h2>
      <p class="text-xs sm:text-sm text-slate-300 mt-0.5">
        Alta velocidad y media distancia en Europa, Norteamérica y Asia con Svelte Runes.
      </p>
    </div>

    <!-- Backend Interoperability Switch -->
    <div class="bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3">
      <div class="text-xs">
        <div class="text-slate-400 font-medium">Backend Activo:</div>
        <div class="font-bold text-white flex items-center gap-1">
          {activeBackend === 'express' ? '⚡ Node.js + Express (Port 4000)' : '🐍 Python + FastAPI (Port 8000)'}
        </div>
      </div>

      <div class="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
        <button
          onclick={() => onToggleBackend('express')}
          class={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
            activeBackend === 'express'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Express
        </button>
        <button
          onclick={() => onToggleBackend('fastapi')}
          class={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
            activeBackend === 'fastapi'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          FastAPI
        </button>
      </div>
    </div>
  </div>

  <!-- Selector Horizontal de 11 Países -->
  <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <MapPin class="w-3.5 h-3.5 text-indigo-600" />
        Selecciona una Red Ferroviaria (11 Países Oficiales)
      </h3>
      <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
        {currentDestination?.flagEmoji} {currentDestination?.country} ({currentDestination?.currency})
      </span>
    </div>

    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {#each destinations as dest (dest.id)}
        <button
          onclick={() => handleCountryChange(dest.id)}
          class={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCountryId === dest.id
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-2'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span class="text-base">{dest.flagEmoji}</span>
          <span>{dest.country}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Formulario de Búsqueda de Trayectos -->
  <div class="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Estación de Origen -->
      <div>
        <label for="fromCity" class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Ciudad de Origen
        </label>
        <div class="relative">
          <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <select
            id="fromCity"
            bind:value={fromCity}
            class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {#each currentDestination?.cities || [] as city}
              <option value={city.name}>{city.name} ({city.station})</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Estación de Destino -->
      <div>
        <label for="toCity" class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Ciudad de Destino
        </label>
        <div class="relative">
          <MapPin class="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
          <select
            id="toCity"
            bind:value={toCity}
            class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {#each currentDestination?.cities || [] as city}
              <option value={city.name}>{city.name} ({city.station})</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Fecha de Viaje -->
      <div>
        <label for="travelDate" class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Fecha de Salida
        </label>
        <div class="relative">
          <Calendar class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="travelDate"
            type="date"
            bind:value={travelDate}
            min="2026-09-01"
            max="2026-12-31"
            class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <!-- Pasajeros -->
      <div>
        <label for="passengerCount" class="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Pasajeros
        </label>
        <div class="relative">
          <Users class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <select
            id="passengerCount"
            value={passengerCount}
            onchange={(e) => passengerCount = Number((e.target as HTMLSelectElement).value)}
            class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value={1}>1 Pasajero (Adulto)</option>
            <option value={2}>2 Pasajeros</option>
            <option value={3}>3 Pasajeros</option>
            <option value={4}>4 Pasajeros (Grupo)</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Barra de Filtros y Resultados -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
        <Train class="w-5 h-5 text-indigo-600" />
        Trenes Disponibles ({filteredTrains.length})
      </h3>
      <p class="text-xs text-slate-500">
        Ruta: {fromCity} ➔ {toCity} • Fecha: {travelDate}
      </p>
    </div>

    <!-- Filtro de clase -->
    <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
      <span class="text-[11px] font-bold text-slate-500 px-2">Clase:</span>
      <button
        onclick={() => filterClass = 'all'}
        class={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
          filterClass === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Todas
      </button>
      <button
        onclick={() => filterClass = 'tourist'}
        class={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
          filterClass === 'tourist' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Turista
      </button>
      <button
        onclick={() => filterClass = 'first'}
        class={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
          filterClass === 'first' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Primera
      </button>
      <button
        onclick={() => filterClass = 'business'}
        class={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
          filterClass === 'business' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Business
      </button>
    </div>
  </div>

  <!-- Listado de Trenes Encontrados -->
  {#if filteredTrains.length === 0}
    <div class="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
      <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
        <Train class="w-6 h-6" />
      </div>
      <h4 class="text-base font-bold text-slate-800">No se encontraron servicios directos</h4>
      <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        No hay trayectos precargados entre {fromCity} y {toCity} en {currentDestination?.country}. Prueba seleccionando otras ciudades del país seleccionado.
      </p>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each filteredTrains as train (train.id)}
        <div class="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <!-- Operadora y modelo -->
            <div class="lg:w-1/4">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                  {train.operator}
                </span>
                <span class="text-xs font-mono font-bold text-slate-500">#{train.trainNumber}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-900 mt-1">{train.trainModel}</h4>
              <div class="mt-2 flex flex-wrap gap-1">
                {#each train.amenities.slice(0, 3) as amenity}
                  <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    {amenity}
                  </span>
                {/each}
              </div>
            </div>

            <!-- Horarios y Duración -->
            <div class="lg:w-2/5 flex items-center justify-between gap-4 border-y lg:border-y-0 lg:border-x border-slate-100 py-3 lg:py-0 lg:px-6">
              <div class="text-left">
                <div class="text-2xl font-black text-slate-900">{train.departureTime}</div>
                <div class="text-xs font-bold text-slate-700">{train.fromCity}</div>
                <div class="text-[11px] text-slate-400 truncate max-w-[130px]">{train.fromStation}</div>
              </div>

              <div class="flex-1 flex flex-col items-center px-2">
                <span class="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Clock class="w-3 h-3 text-slate-400" /> {train.duration}
                </span>
                <div class="w-full flex items-center gap-1">
                  <div class="h-0.5 w-full bg-slate-200 relative">
                    <div class="absolute right-0 -top-1 w-2 h-2 rounded-full bg-indigo-600"></div>
                  </div>
                  <ArrowRight class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                </div>
                <span class="text-[10px] text-emerald-600 font-bold mt-1">Directo Alta Velocidad</span>
              </div>

              <div class="text-right">
                <div class="text-2xl font-black text-slate-900">{train.arrivalTime}</div>
                <div class="text-xs font-bold text-slate-700">{train.toCity}</div>
                <div class="text-[11px] text-slate-400 truncate max-w-[130px]">{train.toStation}</div>
              </div>
            </div>

            <!-- Precio y Acción -->
            <div class="lg:w-1/4 flex items-center justify-between lg:justify-end gap-5">
              <div class="text-left lg:text-right">
                <div class="text-xs text-slate-400 font-medium">Desde</div>
                <div class="text-2xl font-black text-indigo-600">
                  {currentDestination?.currencySymbol || '€'}{train.basePrice}
                  <span class="text-xs font-normal text-slate-500 font-sans ml-0.5">/{train.currency}</span>
                </div>
                <div class="text-[11px] text-emerald-600 font-semibold">
                  {train.availableSeatsCount} asientos disponibles
                </div>
              </div>

              <button
                onclick={() => onSelectTrain(train, travelDate, passengerCount)}
                class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Seleccionar</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
