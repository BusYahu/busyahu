<script lang="ts">
  import { apiGateway } from '../../lib/api.js';

  interface Props {
    onClose: () => void;
    onCreated: () => void;
  }

  let { onClose, onCreated }: Props = $props();

  let routeCode = $state('');
  let routeName = $state('');
  let routeType = $state('Alta Velocidad');
  let routeCountry = $state('ES');
  let routeOrigin = $state('ES-MAD');
  let routeDestination = $state('ES-BCN');
  let routeDeparture = $state('08:30');
  let routeArrival = $state('11:45');
  let routeDuration = $state('3h 15m');
  let routePrice = $state(65.5);
  let routeStatusMsg = $state<string | null>(null);
  let routeLoading = $state(false);

  async function handleCreateRoute(event: Event) {
    event.preventDefault();
    routeStatusMsg = null;
    routeLoading = true;
    try {
      const payload = {
        code: routeCode.trim(),
        name: routeName.trim(),
        type: routeType.trim(),
        countryCode: routeCountry.trim().toUpperCase(),
        originStationId: routeOrigin.trim(),
        destinationStationId: routeDestination.trim(),
        departureTime: routeDeparture.trim(),
        arrivalTime: routeArrival.trim(),
        duration: routeDuration.trim(),
        basePrice: Number(routePrice)
      };
      const data = await apiGateway.createTrain(payload);
      routeStatusMsg = String(data.message ?? 'Ruta creada exitosamente.');
      routeCode = '';
      routeName = '';
      onCreated();
    } catch (error) {
      const apiError = error as { toUserMessage?: () => string; message?: string };
      routeStatusMsg =
        apiError?.toUserMessage?.() || apiError?.message || 'No se pudo conectar con el servidor.';
    } finally {
      routeLoading = false;
    }
  }
</script>

<div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="glass-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
    <div class="bg-slate-950 text-white p-6 relative">
      <button
        onclick={onClose}
        class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
      >
        ✕
      </button>
      <h2 class="text-xl font-black text-white">Crear Nueva Ruta</h2>
      <p class="text-xs text-slate-400 mt-1">Solo disponible para el usuario autorizado.</p>
    </div>

    <form onsubmit={handleCreateRoute} class="p-6 space-y-3">
      {#if routeStatusMsg}
        <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-xs font-bold">
          {routeStatusMsg}
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Código</span>
          <input bind:value={routeCode} required class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" placeholder="AVE-999" />
        </label>
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Nombre</span>
          <input bind:value={routeName} required class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" placeholder="Tren de prueba" />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Tipo</span>
          <input bind:value={routeType} class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
        </label>
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">País (ISO)</span>
          <input bind:value={routeCountry} required class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" placeholder="ES" />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Origen (station id)</span>
          <input bind:value={routeOrigin} required class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" placeholder="ES-MAD" />
        </label>
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Destino (station id)</span>
          <input bind:value={routeDestination} required class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" placeholder="ES-BCN" />
        </label>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Salida</span>
          <input bind:value={routeDeparture} class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
        </label>
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Llegada</span>
          <input bind:value={routeArrival} class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
        </label>
        <label class="block">
          <span class="block text-xs font-bold text-slate-700 mb-1">Duración</span>
          <input bind:value={routeDuration} class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
        </label>
      </div>

      <label class="block">
        <span class="block text-xs font-bold text-slate-700 mb-1">Precio base</span>
        <input type="number" step="0.01" bind:value={routePrice} class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
      </label>

      <button
        type="submit"
        disabled={routeLoading}
        class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all"
      >
        {routeLoading ? 'Creando...' : 'Crear Ruta'}
      </button>
    </form>
  </div>
</div>
