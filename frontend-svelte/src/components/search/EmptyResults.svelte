<script lang="ts">
  import { Train } from 'lucide-svelte';
  import type { Destination } from '../../types';

  interface Props {
    fromCity: string;
    toCity: string;
    destination?: Destination;
    onReset: () => void;
  }

  let { fromCity, toCity, destination, onReset }: Props = $props();
</script>

<div class="glass-card rounded-2xl p-12 text-center space-y-4">
  <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
    <Train class="w-8 h-8" />
  </div>
  <div>
    <h4 class="text-base font-bold text-slate-800">
      No encontramos trenes directos para {fromCity} ➔ {toCity} en este horario
    </h4>
    <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
      Prueba cambiando el filtro de horario a "Todos" o seleccionando otra de las ciudades del país {destination?.country}.
    </p>
  </div>
  <button
    onclick={onReset}
    class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
  >
    Restablecer a la ruta principal
  </button>
</div>
