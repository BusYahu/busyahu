<script lang="ts">
  import { User } from 'lucide-svelte';

  interface Props {
    passengerCount: number;
    passengerNames: string[];
    passengerPassports: string[];
    selectedSeats: string[];
    contactEmail: string;
    onNameChange: (index: number, value: string) => void;
    onPassportChange: (index: number, value: string) => void;
  }

  let {
    passengerCount,
    passengerNames,
    passengerPassports,
    selectedSeats,
    contactEmail = $bindable(),
    onNameChange,
    onPassportChange
  }: Props = $props();
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm space-y-6">
  <div>
    <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
      <User class="w-5 h-5 text-indigo-600" />
      <span>Datos de los Viajeros</span>
    </h3>
    <p class="text-xs text-slate-500 mt-0.5">
      Obligatorio para la emisión del billete nominativo oficial.
    </p>
  </div>

  <div class="space-y-4">
    {#each Array.from({ length: passengerCount }) as _, index (index)}
      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold text-slate-700">
          <span class="flex items-center gap-1.5">
            <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
              {index + 1}
            </span>
            <span>Viajero {index + 1}</span>
          </span>
          <span class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono text-[11px]">
            Asiento: {selectedSeats[index] || 'Por seleccionar'}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-[11px] font-bold text-slate-600 mb-1">Nombre y Apellidos</span>
            <input
              type="text"
              placeholder="Ej. Lucas Gómez"
              value={passengerNames[index] || ''}
              oninput={(event) => onNameChange(index, (event.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </label>

          <label class="block">
            <span class="block text-[11px] font-bold text-slate-600 mb-1">DNI / Pasaporte</span>
            <input
              type="text"
              placeholder="Ej. 45920188A"
              value={passengerPassports[index] || ''}
              oninput={(event) => onPassportChange(index, (event.target as HTMLInputElement).value)}
              class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </label>
        </div>
      </div>
    {/each}

    <label class="block pt-2">
      <span class="block text-xs font-bold text-slate-700 mb-1">
        Email para recibir los billetes electrónicos en PDF
      </span>
      <input
        type="email"
        bind:value={contactEmail}
        class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
        required
      />
    </label>
  </div>
</div>
