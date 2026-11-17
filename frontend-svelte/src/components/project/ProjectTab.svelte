<script lang="ts">
  import type { Layers } from 'lucide-svelte';

  interface Props {
    active: boolean;
    label: string;
    icon: typeof Layers;
    onclick: () => void;
  }

  let { active, label, icon: Icon, onclick }: Props = $props();
</script>

<button
  onclick={onclick}
  class={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
    active ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
  }`}
>
  <Icon class="w-4 h-4" />
  <span>{label}</span>
</button>
