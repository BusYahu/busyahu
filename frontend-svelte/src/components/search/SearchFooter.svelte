<script lang="ts">
  import { Train } from 'lucide-svelte';

  interface Props {
    onOpenProjectDocs?: () => void;
  }

  let { onOpenProjectDocs }: Props = $props();
</script>

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
        Ficha Técnica del Proyecto &amp; Issues
      </button>
    {/if}
    <span class="text-slate-400">© 2026 BusYahu Inc.</span>
  </div>
</footer>
