<script lang="ts">
  import { ChevronRight, Clock } from 'lucide-svelte';
  import type { Destination } from '../../types';

  interface Props {
    destinations: Destination[];
    selectedCountryId: string;
    onCountryChange: (countryId: string) => void;
    onQuickRoute: (countryId: string, from: string, to: string) => void;
  }

  let { destinations, selectedCountryId, onCountryChange, onQuickRoute }: Props = $props();

  const featuredRoutes = [
    {
      image: '/imgs/costa_mediterranea_bcn.jpg',
      alt: 'Costa Mediterránea en tren de alta velocidad',
      badge: '🇪🇸 España · Renfe AVE',
      price: 'Desde 39€',
      title: 'Corredor Madrid ➔ Barcelona',
      description:
        'La línea de alta velocidad más transitada de Europa. 621 km en tan solo 2 horas y media a 310 km/h.',
      duration: '2h 30m Directo',
      countryId: 'es',
      from: 'Madrid',
      to: 'Barcelona'
    },
    {
      image: '/imgs/tren_inoui_paris_lyon_marsella.jpg',
      alt: 'Interior de cabina de primera clase en tren',
      badge: '🇫🇷 Francia · TGV InOui',
      price: 'Desde 72€',
      title: 'Eje París ➔ Lyon / Marsella',
      description:
        'Confort total a 320 km/h. Asientos reclinables de diseño, cafetería Le Bar TGV y conexión WiFi 5G a bordo.',
      duration: '1h 57m Directo',
      countryId: 'fr',
      from: 'París',
      to: 'Lyon'
    },
    {
      image: '/imgs/tren_tokio_a_kioto.jpg',
      alt: 'Tren bala Shinkansen en Japón',
      badge: '🇯🇵 Japón · JR Central',
      price: 'Desde 13.800¥',
      title: 'Línea Tokaido: Tokio ➔ Kioto',
      description:
        'La mítica ruta con vistas al Monte Fuji. Salidas cada 10 minutos con máxima suavidad y comodidad.',
      duration: '2h 15m Directo',
      countryId: 'jp',
      from: 'Tokio',
      to: 'Kioto'
    }
  ];
</script>

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
        value={selectedCountryId}
        onchange={(event) => onCountryChange((event.target as HTMLSelectElement).value)}
        class="bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
      >
        {#each destinations as destination (destination.id)}
          <option value={destination.id}>
            {destination.flagEmoji} {destination.country} ({destination.cities.length} ciudades)
          </option>
        {/each}
      </select>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {#each featuredRoutes as route (route.title)}
      <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
        <div class="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={route.image}
            alt={route.alt}
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerpolicy="no-referrer"
          />
          <div class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            {route.badge}
          </div>
          <div class="absolute bottom-3 right-3 bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow">
            {route.price}
          </div>
        </div>
        <div class="p-5 space-y-3">
          <div>
            <h3 class="font-bold text-slate-900 text-base">{route.title}</h3>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">{route.description}</p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span class="flex items-center gap-1 font-medium">
              <Clock class="w-3.5 h-3.5 text-indigo-600" /> {route.duration}
            </span>
            <button
              onclick={() => onQuickRoute(route.countryId, route.from, route.to)}
              class="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Ver horarios</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</section>
