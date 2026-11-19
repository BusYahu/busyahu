<script lang="ts">
  import { Train } from 'lucide-svelte';

  interface Props {
    onOpenDocs: () => void;
  }

  let { onOpenDocs }: Props = $props();
</script>

<footer class="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-2">
      <Train class="w-4 h-4 text-indigo-500" />
      <span class="font-bold text-white">BusYahu Rail</span>
      <span>· Sistema Oficial de Billetes Ferroviarios de Alta Velocidad</span>
    </div>

    <div class="flex items-center gap-4">
      <button onclick={onOpenDocs} class="text-indigo-400 hover:text-indigo-300 font-semibold">
        Ficha Técnica del Proyecto (12 Issues)
      </button>
      <span>·</span>
      <span>© 2026 Programación 3</span>
    </div>
  </div>
</footer>
