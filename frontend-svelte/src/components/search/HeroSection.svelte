<script lang="ts">
  import { Train } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    onQuickRoute: (countryId: string, from: string, to: string) => void;
    children?: Snippet;
  }

  let { onQuickRoute, children }: Props = $props();

  const quickRoutes = [
    { countryId: 'es', from: 'Madrid', to: 'Barcelona', label: '🇪🇸 Madrid ➔ Barcelona' },
    { countryId: 'fr', from: 'París', to: 'Lyon', label: '🇫🇷 París ➔ Lyon' },
    { countryId: 'jp', from: 'Tokio', to: 'Kioto', label: '🇯🇵 Tokio ➔ Kioto' },
    { countryId: 'de', from: 'Berlín', to: 'Múnich', label: '🇩🇪 Berlín ➔ Múnich' }
  ];
</script>

<section class="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 text-white min-h-[460px] flex flex-col justify-between">
  <div class="absolute inset-0 pointer-events-none">
    <img
      src="/imgs/tren_inoui_paris_lyon_marsella.jpg"
      alt="Tren de alta velocidad en paisaje europeo"
      class="w-full h-full object-cover object-center opacity-40 brightness-75 scale-105"
      referrerpolicy="no-referrer"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30"></div>
  </div>

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

    <div class="mt-5 flex flex-wrap items-center gap-2 text-xs">
      <span class="text-slate-400 font-medium">Rutas populares:</span>
      {#each quickRoutes as route (route.label)}
        <button
          onclick={() => onQuickRoute(route.countryId, route.from, route.to)}
          class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full transition-colors font-medium border border-white/10"
        >
          {route.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="relative z-10 px-4 sm:px-8 pb-8">
    {@render children?.()}
  </div>
</section>
