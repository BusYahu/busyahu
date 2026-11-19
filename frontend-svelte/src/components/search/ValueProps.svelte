<script lang="ts">
  import { Luggage, ShieldCheck, Zap } from 'lucide-svelte';

  const values = [
    {
      icon: Luggage,
      tone: 'bg-indigo-50 text-indigo-600',
      title: 'Equipaje Siempre Incluido',
      description: 'Viaja con hasta 2 maletas grandes + equipaje de mano sin cargos ocultos.'
    },
    {
      icon: ShieldCheck,
      tone: 'bg-emerald-50 text-emerald-600',
      title: 'Elección de Asiento en Vagón',
      description: 'Mapa visual con selección de ventana, pasillo o mesa en tiempo real.'
    },
    {
      icon: Zap,
      tone: 'bg-amber-50 text-amber-600',
      title: 'Billete Digital Instantáneo',
      description: 'Recibe tu billete electrónico con código QR listo para subir al tren.'
    }
  ];
</script>

<section class="grid grid-cols-1 sm:grid-cols-3 gap-6">
  {#each values as value (value.title)}
    <div class="glass-card p-5 rounded-2xl shadow-sm flex items-start gap-3.5">
      <div class="w-10 h-10 rounded-xl {value.tone} flex items-center justify-center shrink-0">
        <value.icon class="w-5 h-5" />
      </div>
      <div>
        <h4 class="text-sm font-bold text-slate-900">{value.title}</h4>
        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{value.description}</p>
      </div>
    </div>
  {/each}
</section>
