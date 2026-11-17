<script lang="ts">
  import { MapPin } from 'lucide-svelte';

  interface CityOption {
    name: string;
    station: string;
  }

  interface Props {
    id: string;
    label: string;
    tone: 'indigo' | 'emerald';
    cities: CityOption[];
    value: string;
  }

  let { id, label, tone, cities, value = $bindable() }: Props = $props();

  const iconTone = $derived(tone === 'indigo' ? 'text-indigo-600' : 'text-emerald-600');
</script>

<div class="md:col-span-3">
  <label for={id} class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
    {label}
  </label>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none {iconTone}">
      <MapPin class="w-4 h-4" />
    </div>
    <select
      {id}
      bind:value
      class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
    >
      {#each cities as city (city.name)}
        <option value={city.name}>{city.name} ({city.station})</option>
      {/each}
    </select>
  </div>
</div>
