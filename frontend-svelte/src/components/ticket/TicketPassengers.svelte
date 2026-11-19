<script lang="ts">
  import type { Booking } from '../../types';
  import { Calendar, Luggage } from 'lucide-svelte';

  interface Props {
    booking: Booking;
  }

  let { booking }: Props = $props();
</script>

<div class="sm:col-span-8 space-y-3">
  <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">
    Pasajeros & Asientos Asignados
  </div>
  <div class="space-y-2">
    {#each booking.passengers as passenger, index (passenger.seatId + index)}
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <div>
          <div class="font-extrabold text-slate-900 text-sm">{passenger.fullName}</div>
          <div class="text-slate-500 font-mono text-[11px]">Doc: {passenger.passportId}</div>
        </div>
        <div class="text-right">
          <div class="font-mono font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
            Asiento: {passenger.seatId}
          </div>
          <div class="text-[10px] text-slate-400 capitalize mt-0.5">
            Clase {passenger.seatClass}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
    <span class="flex items-center gap-1">
      <Calendar class="w-3.5 h-3.5 text-slate-400" /> Fecha: {booking.travelDate}
    </span>
    <span class="flex items-center gap-1">
      <Luggage class="w-3.5 h-3.5 text-slate-400" /> Equipaje: 2 bultos + 1 mano
    </span>
  </div>
</div>
