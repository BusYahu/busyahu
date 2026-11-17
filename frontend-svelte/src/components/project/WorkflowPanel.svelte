<script lang="ts">
  const steps = [
    {
      title: 'Objetivo Principal',
      detail:
        'Plataforma centralizada de reservas ferroviarias para 11 redes mundiales, con emisión de ticket y gestión de roles.',
    },
    {
      title: 'Límites y Alcances',
      detail:
        'Fijar qué está dentro del sistema (catálogo 11 países, checkout, QR) y qué queda fuera (pasarela real de pago, GPS satelital).',
    },
    {
      title: 'División en Tareas',
      detail:
        '12 issues SMART organizadas en 4 fases secuenciales con criterios de aceptación claros y asignación de equipo.',
    },
    {
      title: 'Desarrollo y CI/CD',
      detail:
        'Ramas git por feature, pull requests revisados con capturas de evidencia, Docker Compose y paridad total.',
    },
  ];
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm space-y-6">
  <h3 class="text-lg font-black text-slate-900">
    Metodología de Desarrollo en 4 Pasos Obligatorios
  </h3>

  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    {#each steps as step, index}
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <div class="text-xs font-mono font-bold text-indigo-600">PASO {index + 1}</div>
        <h4 class="text-sm font-bold text-slate-800">{step.title}</h4>
        <p class="text-xs text-slate-600">{step.detail}</p>
      </div>
    {/each}
  </div>
</div>
