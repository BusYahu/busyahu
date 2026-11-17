<script lang="ts">
  import { Calendar, CheckCircle2, Clock } from 'lucide-svelte';
  import type { Booking } from '../../types';

  interface Props {
    booking: Booking;
    isCancelled: boolean;
    isExpired: boolean;
  }

  let { booking, isCancelled, isExpired }: Props = $props();
</script>

<div class="space-y-3 flex-1">
  <div class="flex flex-wrap items-center gap-2.5">
    <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
      {booking.bookingCode}
    </span>
    <span class="text-xs text-slate-600 font-semibold">
      {booking.train.operator} · {booking.train.country}
    </span>
    <span class="text-xs text-slate-400 font-mono">(Tren #{booking.train.trainNumber})</span>

    {#if isCancelled}
      <span class="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded-md">
        Cancelado (Asiento Liberado)
      </span>
    {:else if isExpired}
      <span class="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
        <Clock class="w-3.5 h-3.5" /> Vencido
      </span>
    {:else}
      <span class="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
        <CheckCircle2 class="w-3.5 h-3.5" /> Confirmado
      </span>
    {/if}
  </div>

  <div class="flex items-center gap-6 sm:gap-10">
    <div>
      <div class="text-xl font-black text-slate-900">{booking.train.fromCity}</div>
      <div class="text-xs text-slate-500 font-medium">{booking.train.fromStation}</div>
      <div class="text-xs font-bold text-indigo-600 mt-0.5">{booking.train.departureTime} h</div>
    </div>

    <div class="flex flex-col items-center">
      <span class="text-[11px] text-slate-400 font-mono flex items-center gap-1">
        <Calendar class="w-3.5 h-3.5" /> {booking.travelDate}
      </span>
      <div class="w-16 h-0.5 bg-slate-200 my-1 relative">
        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
      </div>
      <span class="text-[10px] text-slate-400 font-medium">{booking.train.duration}</span>
    </div>

    <div>
      <div class="text-xl font-black text-slate-900">{booking.train.toCity}</div>
      <div class="text-xs text-slate-500 font-medium">{booking.train.toStation}</div>
      <div class="text-xs font-bold text-indigo-600 mt-0.5">{booking.train.arrivalTime} h</div>
    </div>
  </div>

  <div class="text-xs text-slate-600 flex flex-wrap items-center gap-2 pt-1">
    <span class="font-semibold text-slate-800">Pasajeros:</span>
    {#each booking.passengers as passenger (passenger.seatId)}
      <span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
        {passenger.fullName} <strong class="text-indigo-600 font-mono">(Asiento {passenger.seatId})</strong>
      </span>
    {/each}
  </div>
</div>
