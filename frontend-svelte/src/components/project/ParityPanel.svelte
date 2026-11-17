<script lang="ts">
  const combinations = [
    {
      title: 'Combinación A: React 19 + Express',
      detail: 'Puerto 5173 ➔ Puerto 4000. Validado y funcional.',
      tone: 'border-indigo-200 bg-indigo-50/50',
      titleTone: 'text-indigo-700',
    },
    {
      title: 'Combinación B: React 19 + FastAPI',
      detail: 'Puerto 5173 ➔ Puerto 8000. Validado y funcional.',
      tone: 'border-emerald-200 bg-emerald-50/50',
      titleTone: 'text-emerald-700',
    },
    {
      title: 'Combinación C: Svelte 5 + Express',
      detail: 'Puerto 5174 ➔ Puerto 4000. Conexión idéntica mediante la capa de servicios HTTP.',
      tone: 'border-amber-200 bg-amber-50/50',
      titleTone: 'text-amber-700',
    },
    {
      title: 'Combinación D: Svelte 5 + FastAPI',
      detail: 'Puerto 5174 ➔ Puerto 8000. Conexión idéntica mediante la capa de servicios HTTP.',
      tone: 'border-purple-200 bg-purple-50/50',
      titleTone: 'text-purple-700',
    },
  ];
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm space-y-4">
  <h3 class="text-lg font-black text-slate-900">
    Matriz de Interoperabilidad 2x2 (Frontends x Backends)
  </h3>
  <p class="text-xs text-slate-600">
    Criterio de aprobación del trabajo final: ambas combinaciones de frontend deben funcionar indistintamente con cualquiera de los dos servidores backend.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each combinations as combination (combination.title)}
      <div class="p-4 rounded-xl border {combination.tone} space-y-2">
        <div class="text-xs font-bold {combination.titleTone}">{combination.title}</div>
        <div class="text-xs text-slate-700">{combination.detail}</div>
      </div>
    {/each}
  </div>
</div>
