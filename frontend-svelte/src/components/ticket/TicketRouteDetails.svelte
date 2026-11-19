<script lang="ts">
  import type { Booking } from '../../types';
  import { Clock } from 'lucide-svelte';

  interface Props {
    booking: Booking;
  }

  let { booking }: Props = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-center">
  <div class="text-left space-y-1">
    <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
      Estación de Origen
    </div>
    <div class="text-2xl sm:text-3xl font-black text-slate-900">
      {booking.train.fromCity}
    </div>
    <div class="text-xs text-slate-500 font-medium">
      {booking.train.fromStation}
    </div>
    <div class="text-base font-black text-indigo-600 pt-1 tabular-nums">
      {booking.train.departureTime} h
    </div>
  </div>

  <div class="flex flex-col items-center">
    <span class="text-xs font-bold text-slate-500 flex items-center gap-1">
      <Clock class="w-3.5 h-3.5 text-indigo-600" /> {booking.train.duration}
    </span>
    <div class="w-full max-w-[140px] h-1 bg-slate-200 rounded-full my-2.5 relative">
      <div class="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700"></div>
      <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-600"></div>
    </div>
    <span class="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
      Tren #{booking.train.trainNumber}
    </span>
  </div>

  <div class="text-right space-y-1">
    <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
      Estación de Llegada
    </div>
    <div class="text-2xl sm:text-3xl font-black text-slate-900">
      {booking.train.toCity}
    </div>
    <div class="text-xs text-slate-500 font-medium">
      {booking.train.toStation}
    </div>
    <div class="text-base font-black text-indigo-600 pt-1 tabular-nums">
      {booking.train.arrivalTime} h
    </div>
  </div>
</div>

<div class="relative py-2">
  <div class="border-t-2 border-dashed border-slate-300 w-full"></div>
  <div class="absolute -left-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>
  <div class="absolute -right-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>
</div>
