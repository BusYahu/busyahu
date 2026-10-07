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
    Luggage,
    ShieldCheck, 
    Wifi, 
    Zap, 
    Coffee, 
    VolumeX, 
    ArrowLeftRight,
    ChevronRight,
    Check
  } from 'lucide-svelte';

  interface Props {
    destinations: Destination[];
    trains: TrainRoute[];
    activeBackend?: 'express' | 'fastapi';
    onSelectTrain: (train: TrainRoute, travelDate: string, passengerCount: number, selectedClass?: 'tourist' | 'first' | 'business') => void;
    onToggleBackend?: (backend: 'express' | 'fastapi') => void;
    onOpenProjectDocs?: () => void;
  }

  let { 
    destinations = [], 
    trains = [], 
    activeBackend = 'express', 
    onSelectTrain, 
    onToggleBackend,
    onOpenProjectDocs
  }: Props = $props();

  let selectedCountryId = $state<string>('es');
  let fromCity = $state<string>('Madrid');
  let toCity = $state<string>('Barcelona');
  let travelDate = $state<string>('2026-09-15');
  let passengerCount = $state<number>(1);
  let selectedClassTier = $state<'tourist' | 'first' | 'business'>('tourist');
  let timeFilter = $state<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  let sortBy = $state<'price_asc' | 'duration_asc' | 'departure_asc'>('price_asc');

  let currentDestination = $derived(
    destinations.find((d) => d.id === selectedCountryId) || destinations[0]
  );

  let currentCurrencySymbol = $derived(
    currentDestination?.currencySymbol || '€'
  );

  function handleCountryChange(countryId: string) {
    selectedCountryId = countryId;
    const dest = destinations.find((d) => d.id === countryId);
    if (dest && dest.cities.length >= 2) {
      fromCity = dest.cities[0].name;
      toCity = dest.cities[1].name;
    }
  }

  function handleSwapCities() {
    const temp = fromCity;
    fromCity = toCity;
    toCity = temp;
  }

  function handleQuickRoute(countryId: string, from: string, to: string) {
    selectedCountryId = countryId;
    fromCity = from;
    toCity = to;
    const resultsElem = document.getElementById('train-results-section');
    if (resultsElem) {
      resultsElem.scrollIntoView({ behavior: 'smooth' });
    }
  }

  let filteredTrains = $derived(
    trains
      .filter((train) => {
        const matchCountry = currentDestination 
          ? train.country.toLowerCase() === currentDestination.country.toLowerCase() 
          : true;
        const matchFrom = fromCity ? train.fromCity.toLowerCase() === fromCity.toLowerCase() : true;
        const matchTo = toCity ? train.toCity.toLowerCase() === toCity.toLowerCase() : true;

        let matchTime = true;
        if (timeFilter !== 'all') {
          const hour = parseInt(train.departureTime.split(':')[0], 10);
          if (timeFilter === 'morning') matchTime = hour >= 6 && hour < 12;
          if (timeFilter === 'afternoon') matchTime = hour >= 12 && hour < 18;
          if (timeFilter === 'evening') matchTime = hour >= 18 || hour < 6;
        }

        return matchCountry && matchFrom && matchTo && matchTime;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
        if (sortBy === 'departure_asc') return a.departureTime.localeCompare(b.departureTime);
        if (sortBy === 'duration_asc') return a.duration.localeCompare(b.duration);
        return 0;
      })
  );
</script>

<div id="train-search-view" class="space-y-12 pb-16">
  <!-- 1. HERO SECTION: Consumer Rail Booking Hub -->
  <section class="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 text-white min-h-[460px] flex flex-col justify-between">
    <!-- Cinematic Backdrop Image -->
    <div class="absolute inset-0 pointer-events-none">
      <img
        src="/src/assets/images/hero_highspeed_train_1791381943799.jpg"
        alt="Tren de alta velocidad en paisaje europeo"
        class="w-full h-full object-cover object-center opacity-40 brightness-75 scale-105"
        referrerpolicy="no-referrer"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30"></div>
    </div>

    <!-- Hero Copy -->
    <div class="relative z-10 px-6 sm:px-10 pt-10 pb-6 max-w-4xl">
      <div class="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-3">
        <Train class="w-4 h-4 text-indigo-400" />
        <span>Red Oficial de Alta Velocidad · BusYahu Rail</span>
        <span>·</span>
        <span class="text-slate-300">11 Países Conectados</span>
      </div>

      <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
        Viaja en alta velocidad por el mundo con la mejor tarifa
      </h1>

      <p class="mt-3 text-sm sm:text-base text-slate-200 max-w-2xl font-normal leading-relaxed">
        Busca y compara rutas en tren, reserva tu asiento en el vagón interactivo y viaja con billete electrónico en tu móvil.
      </p>

      <!-- Quick Route Shortcuts -->
      <div class="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span class="text-slate-400 font-medium">Rutas populares:</span>
        <button
          onclick={() => handleQuickRoute('es', 'Madrid', 'Barcelona')}
          class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full transition-colors font-medium border border-white/10"
        >
          🇪🇸 Madrid ➔ Barcelona
        </button>
        <button
          onclick={() => handleQuickRoute('fr', 'París', 'Lyon')}
          class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full transition-colors font-medium border border-white/10"
        >
          🇫🇷 París ➔ Lyon
        </button>
        <button
          onclick={() => handleQuickRoute('jp', 'Tokio', 'Kioto')}
          class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full transition-colors font-medium border border-white/10"
        >
          🇯🇵 Tokio ➔ Kioto
        </button>
        <button
          onclick={() => handleQuickRoute('de', 'Berlín', 'Múnich')}
          class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full transition-colors font-medium border border-white/10"
        >
          🇩🇪 Berlín ➔ Múnich
        </button>
      </div>
    </div>

    <!-- SEARCH WIDGET FLOATING BAR -->
    <div class="relative z-10 px-4 sm:px-8 pb-8">
      <div class="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200">
        <!-- Top Selector: Country & Class -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 text-xs">
          <div class="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            <span class="text-slate-500 font-medium whitespace-nowrap">País:</span>
            {#each destinations as dest}
              <button
                onclick={() => handleCountryChange(dest.id)}
                class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 {selectedCountryId === dest.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
              >
                <span>{dest.flagEmoji}</span>
                <span>{dest.country}</span>
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

        <!-- Search Inputs Grid -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <!-- Origin -->
          <div class="md:col-span-3">
            <label for="fromCity" class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Origen
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-600">
                <MapPin class="w-4 h-4" />
              </div>
              <select
                id="fromCity"
                bind:value={fromCity}
                class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {#each (currentDestination?.cities || []) as city}
                  <option value={city.name}>
                    {city.name} ({city.station})
                  </option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Swap Button -->
          <div class="md:col-span-1 flex justify-center pb-1">
            <button
              type="button"
              onclick={handleSwapCities}
              title="Intercambiar origen y destino"
              class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-sm"
            >
              <ArrowLeftRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Destination -->
          <div class="md:col-span-3">
            <label for="toCity" class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Destino
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                <MapPin class="w-4 h-4" />
              </div>
              <select
                id="toCity"
                bind:value={toCity}
                class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                {#each (currentDestination?.cities || []) as city}
                  <option value={city.name}>
                    {city.name} ({city.station})
                  </option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Travel Date -->
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
                bind:value={travelDate}
                class="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <!-- Passengers Stepper -->
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
                {#each [1, 2, 3, 4, 5, 6] as num}
                  <option value={num}>
                    {num} {num === 1 ? 'persona' : 'personas'}
                  </option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Search CTA Button -->
          <div class="md:col-span-2">
            <button
              type="button"
              onclick={() => {
                const resultsElem = document.getElementById('train-results-section');
                if (resultsElem) {
                  resultsElem.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Search class="w-4 h-4" />
              <span>Buscar Trenes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 2. VALUE PROPOSITIONS -->
  <section class="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Luggage class="w-5 h-5" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-900">Equipaje Siempre Incluido</h4>
        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Viaja con hasta 2 maletas grandes + equipaje de mano sin cargos ocultos.
        </p>
      </div>
    </div>

    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <ShieldCheck class="w-5 h-5" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-900">Elección de Asiento en Vagón</h4>
        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Mapa visual con selección de ventana, pasillo o mesa en tiempo real.
        </p>
      </div>
    </div>

    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
        <Zap class="w-5 h-5" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-900">Billete Digital Instantáneo</h4>
        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Recibe tu billete electrónico con código QR listo para subir al tren.
        </p>
      </div>
    </div>
  </section>

  <!-- 3. SECTION: INVESTIGATE DESTINATIONS & TRAINS -->
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <div class="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          Catálogo de Destinos
        </div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">
          Investiga las mejores rutas en tren de alta velocidad
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Conexiones punto a punto directas de centro a centro de ciudad.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 font-medium">Filtrar por país:</span>
        <select
          bind:value={selectedCountryId}
          onchange={(e) => handleCountryChange((e.target as HTMLSelectElement).value)}
          class="bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
        >
          {#each destinations as d}
            <option value={d.id}>
              {d.flagEmoji} {d.country} ({d.cities.length} ciudades)
            </option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card 1 -->
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="relative h-48 overflow-hidden bg-slate-100">
          <img
            src="/src/assets/images/dest_barcelona_coast_1791381953516.jpg"
            alt="Costa Mediterránea en tren de alta velocidad"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerpolicy="no-referrer"
          />
          <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            🇪🇸 España · Renfe AVE
          </div>
          <div class="absolute bottom-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow">
            Desde 39€
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Corredor Madrid ➔ Barcelona</h3>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">
              La línea de alta velocidad más transitada de Europa. 621 km en tan solo 2 horas y media a 310 km/h.
            </p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span class="flex items-center gap-1 font-medium">
              <Clock class="w-3.5 h-3.5 text-indigo-600" /> 2h 30m Directo
            </span>
            <button
              onclick={() => handleQuickRoute('es', 'Madrid', 'Barcelona')}
              class="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver horarios</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="relative h-48 overflow-hidden bg-slate-100">
          <img
            src="/src/assets/images/train_luxury_interior_1791381964518.jpg"
            alt="Interior de cabina de primera clase en tren"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerpolicy="no-referrer"
          />
          <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            🇫🇷 Francia · TGV InOui
          </div>
          <div class="absolute bottom-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow">
            Desde 72€
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Eje París ➔ Lyon / Marsella</h3>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">
              Confort total a 320 km/h. Asientos reclinables de diseño, cafetería Le Bar TGV y conexión WiFi 5G a bordo.
            </p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span class="flex items-center gap-1 font-medium">
              <Clock class="w-3.5 h-3.5 text-indigo-600" /> 1h 57m Directo
            </span>
            <button
              onclick={() => handleQuickRoute('fr', 'París', 'Lyon')}
              class="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver horarios</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
        <div class="relative h-48 overflow-hidden bg-slate-900 flex items-center justify-center text-white">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 opacity-90"></div>
          <div class="relative z-10 text-center p-6 space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center mx-auto">
              <Train class="w-6 h-6" />
            </div>
            <div class="text-lg font-black tracking-tight">Shinkansen Nozomi</div>
            <div class="text-xs text-indigo-200">Puntualidad milimétrica en Japón</div>
          </div>
          <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            🇯🇵 Japón · JR Central
          </div>
          <div class="absolute bottom-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow">
            Desde 13.800¥
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Línea Tokaido: Tokio ➔ Kioto</h3>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">
              La mítica ruta con vistas al Monte Fuji. Salidas cada 10 minutos con máxima suavidad y comodidad.
            </p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span class="flex items-center gap-1 font-medium">
              <Clock class="w-3.5 h-3.5 text-indigo-600" /> 2h 15m Directo
            </span>
            <button
              onclick={() => handleQuickRoute('jp', 'Tokio', 'Kioto')}
              class="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver horarios</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 4. SECTION: TRAIN RESULTS LIST & SEAT SELECTION TRIGGER -->
  <section id="train-results-section" class="space-y-6 pt-4">
    <!-- Results Header -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>{currentDestination?.flagEmoji} {currentDestination?.country}</span>
            <span>·</span>
            <span>{travelDate}</span>
            <span>·</span>
            <span>{passengerCount} {passengerCount === 1 ? 'viajero' : 'viajeros'}</span>
          </div>
          <h3 class="text-xl font-black text-slate-900 mt-0.5">
            Trenes disponibles: {fromCity} ➔ {toCity}
          </h3>
        </div>

        <!-- Sorting & Schedule Filters -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="text-slate-500 font-medium">Horario:</span>
          <div class="flex bg-slate-100 p-1 rounded-lg">
            <button
              onclick={() => (timeFilter = 'all')}
              class="px-2.5 py-1 rounded-md font-medium transition-colors {timeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
            >
              Todos
            </button>
            <button
              onclick={() => (timeFilter = 'morning')}
              class="px-2.5 py-1 rounded-md font-medium transition-colors {timeFilter === 'morning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
            >
              Mañana
            </button>
            <button
              onclick={() => (timeFilter = 'afternoon')}
              class="px-2.5 py-1 rounded-md font-medium transition-colors {timeFilter === 'afternoon' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
            >
              Tarde
            </button>
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

    <!-- Results Cards -->
    {#if filteredTrains.length === 0}
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Train class="w-8 h-8" />
        </div>
        <div>
          <h4 class="text-base font-bold text-slate-800">
            No encontramos trenes directos para {fromCity} ➔ {toCity} en este horario
          </h4>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Prueba cambiando el filtro de horario a "Todos" o seleccionando otra de las ciudades del país {currentDestination?.country}.
          </p>
        </div>
        <button
          onclick={() => {
            timeFilter = 'all';
            if (currentDestination && currentDestination.cities.length >= 2) {
              fromCity = currentDestination.cities[0].name;
              toCity = currentDestination.cities[1].name;
            }
          }}
          class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          Restablecer a la ruta principal
        </button>
      </div>
    {:else}
      <div class="space-y-4">
        {#each filteredTrains as train (train.id)}
          {@const touristPrice = train.basePrice}
          {@const firstPrice = Math.round(train.basePrice * 1.4)}
          {@const businessPrice = Math.round(train.basePrice * 1.8)}

          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all p-5 sm:p-6">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <!-- Left Details -->
              <div class="space-y-4 flex-1">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-md">
                    {train.operator}
                  </span>
                  <span class="text-xs font-semibold text-slate-700">
                    {train.trainModel}
                  </span>
                  <span class="text-xs text-slate-400 font-mono">
                    Tren #{train.trainNumber}
                  </span>
                  <span class="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check class="w-3 h-3" /> {train.availableSeatsCount} asientos libres
                  </span>
                </div>

                <!-- Schedule Timeline -->
                <div class="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
                  <div class="sm:col-span-4">
                    <div class="text-2xl font-black text-slate-900 tabular-nums">
                      {train.departureTime}
                    </div>
                    <div class="text-sm font-bold text-slate-800">{train.fromCity}</div>
                    <div class="text-xs text-slate-500 truncate" title={train.fromStation}>
                      {train.fromStation}
                    </div>
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
                    <div class="text-2xl font-black text-slate-900 tabular-nums">
                      {train.arrivalTime}
                    </div>
                    <div class="text-sm font-bold text-slate-800">{train.toCity}</div>
                    <div class="text-xs text-slate-500 truncate" title={train.toStation}>
                      {train.toStation}
                    </div>
                  </div>
                </div>

                <!-- Amenities -->
                <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span class="flex items-center gap-1">
                    <Wifi class="w-3.5 h-3.5 text-indigo-600" /> WiFi gratuito
                  </span>
                  <span class="flex items-center gap-1">
                    <Zap class="w-3.5 h-3.5 text-amber-500" /> Enchufe individual
                  </span>
                  <span class="flex items-center gap-1">
                    <Coffee class="w-3.5 h-3.5 text-amber-700" /> Coche cafetería
                  </span>
                  <span class="flex items-center gap-1">
                    <VolumeX class="w-3.5 h-3.5 text-slate-500" /> Coche silencioso
                  </span>
                  <span class="flex items-center gap-1">
                    <Luggage class="w-3.5 h-3.5 text-emerald-600" /> 2 maletas incluidas
                  </span>
                </div>
              </div>

              <!-- Right Fares & CTA -->
              <div class="lg:w-72 bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between space-y-4">
                <div class="space-y-2">
                  <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                    Tarifas por viajero:
                  </span>

                  <!-- Turista -->
                  <button
                    type="button"
                    onclick={() => (selectedClassTier = 'tourist')}
                    class="w-full p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors text-left {selectedClassTier === 'tourist' ? 'bg-indigo-50 border border-indigo-300 font-bold text-indigo-950' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}"
                  >
                    <div>
                      <span class="block font-semibold">Turista</span>
                      <span class="text-[10px] text-slate-500 font-normal">Estándar reclinable</span>
                    </div>
                    <div class="font-extrabold text-sm tabular-nums text-slate-900">
                      {touristPrice} {currentCurrencySymbol}
                    </div>
                  </button>

                  <!-- Primera -->
                  <button
                    type="button"
                    onclick={() => (selectedClassTier = 'first')}
                    class="w-full p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors text-left {selectedClassTier === 'first' ? 'bg-indigo-50 border border-indigo-300 font-bold text-indigo-950' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}"
                  >
                    <div>
                      <span class="block font-semibold">Primera</span>
                      <span class="text-[10px] text-slate-500 font-normal">Extra espacio + café</span>
                    </div>
                    <div class="font-extrabold text-sm tabular-nums text-slate-900">
                      {firstPrice} {currentCurrencySymbol}
                    </div>
                  </button>

                  <!-- Business -->
                  <button
                    type="button"
                    onclick={() => (selectedClassTier = 'business')}
                    class="w-full p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors text-left {selectedClassTier === 'business' ? 'bg-indigo-50 border border-indigo-300 font-bold text-indigo-950' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'}"
                  >
                    <div>
                      <span class="block font-semibold">Gran Clase</span>
                      <span class="text-[10px] text-slate-500 font-normal">Sala VIP + Menú</span>
                    </div>
                    <div class="font-extrabold text-sm tabular-nums text-slate-900">
                      {businessPrice} {currentCurrencySymbol}
                    </div>
                  </button>
                </div>

                <button
                  onclick={() => onSelectTrain(train, travelDate, passengerCount, selectedClassTier)}
                  class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Elegir Asiento en Vagón</span>
                  <ArrowRight class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- 5. FOOTER TRUST & DISCRETE ACADEMIC INFO ACCESS -->
  <footer class="pt-10 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-2">
      <Train class="w-4 h-4 text-indigo-600" />
      <span class="font-bold text-slate-700">BusYahu Rail Express</span>
      <span>·</span>
      <span>Plataforma oficial de reservas ferroviarias</span>
    </div>

    <div class="flex items-center gap-4">
      {#if onOpenProjectDocs}
        <button
          onclick={onOpenProjectDocs}
          class="text-slate-600 hover:text-indigo-600 underline font-medium"
        >
          Ficha Técnica del Proyecto & Issues
        </button>
      {/if}
      <span class="text-slate-400">© 2026 BusYahu Inc.</span>
    </div>
  </footer>
</div>
