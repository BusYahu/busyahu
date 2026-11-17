<script lang="ts">
  import type { Booking } from '../../types';
  import { Train } from 'lucide-svelte';

  interface Props {
    booking: Booking;
  }

  let { booking }: Props = $props();
</script>

<div class="bg-slate-950 text-white p-6 flex flex-wrap items-center justify-between gap-4">
  <div class="flex items-center gap-3">
    <div class="p-2.5 bg-indigo-600 rounded-xl text-white">
      <Train class="w-6 h-6" />
    </div>
    <div>
      <div class="text-xs text-indigo-300 font-mono font-bold tracking-wider uppercase">
        {booking.train.operator} · {booking.train.country}
      </div>
      <div class="text-lg font-black text-white">{booking.train.trainModel}</div>
    </div>
  </div>

  <div class="text-right">
    <span class="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">
      Localizador
    </span>
    <span class="text-xl font-mono font-black text-amber-400">
      {booking.bookingCode}
    </span>
  </div>
</div>
