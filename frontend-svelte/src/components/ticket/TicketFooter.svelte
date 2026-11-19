<script lang="ts">
  import type { Booking } from '../../types';
  import { ShieldCheck } from 'lucide-svelte';

  interface Props {
    booking: Booking;
  }

  let { booking }: Props = $props();
</script>

<div class="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
  <div>
    Emitido el: <strong class="text-slate-700">{booking.createdAt}</strong> · Tarifa total:
    <strong class="text-slate-900 font-mono font-bold">
      {booking.totalPrice} {booking.currency}
    </strong>
  </div>
  <div class="flex items-center gap-1.5 text-emerald-700 font-semibold">
    <ShieldCheck class="w-4 h-4" />
    <span>Billete Nominativo Verificado</span>
  </div>
</div>
