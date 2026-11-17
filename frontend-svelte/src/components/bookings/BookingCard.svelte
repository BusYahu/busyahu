<script lang="ts">
  import { QrCode, Trash2 } from 'lucide-svelte';
  import type { Booking } from '../../types';
  import BookingSummary from './BookingSummary.svelte';

  interface Props {
    booking: Booking;
    qrSrc?: string;
    isExpired: boolean;
    isConfirmingCancel: boolean;
    onViewTicket: () => void;
    onStartCancel: () => void;
    onConfirmCancel: () => void;
    onDismissCancel: () => void;
  }

  let {
    booking,
    qrSrc,
    isExpired,
    isConfirmingCancel,
    onViewTicket,
    onStartCancel,
    onConfirmCancel,
    onDismissCancel
  }: Props = $props();

  const isCancelled = $derived(booking.status === 'cancelled');
  const isInactive = $derived(isCancelled || isExpired);
</script>

<div
  class="bg-white border rounded-2xl p-5 sm:p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6 {isInactive
    ? 'border-slate-200 bg-slate-50/70 opacity-70'
    : 'border-slate-200 hover:border-slate-300'}"
>
  <BookingSummary {booking} {isCancelled} {isExpired} />

  <div class="mt-3 flex items-center gap-3">
    {#if qrSrc}
      <img
        src={qrSrc}
        alt="QR de acceso"
        class="w-24 h-24 rounded-xl border border-slate-200 bg-white p-2 shadow-sm object-contain"
      />
    {:else}
      <div class="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] font-semibold">
        Generando QR...
      </div>
    {/if}
    <div class="text-[11px] text-slate-500 space-y-0.5">
      <div class="font-semibold text-slate-700">QR de torniquete</div>
      <div class="font-mono truncate max-w-[220px]">{booking.qrPayload || booking.bookingCode}</div>
    </div>
  </div>

  <div class="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 gap-3">
    <div class="text-left md:text-right">
      <div class="text-[11px] text-slate-400 font-medium">Tarifa total</div>
      <div class="text-xl font-black text-slate-900 tabular-nums">
        {booking.totalPrice} {booking.currency}
      </div>
    </div>

    <div class="flex items-center gap-2">
      {#if !isCancelled}
        <button
          onclick={onViewTicket}
          class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <QrCode class="w-4 h-4" />
          <span>Ver Billete & QR</span>
        </button>

        {#if !isExpired}
          {#if isConfirmingCancel}
            <div class="flex items-center gap-1">
              <button
                onclick={onConfirmCancel}
                class="px-2.5 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg hover:bg-rose-700 transition-colors"
              >
                Sí, anular
              </button>
              <button
                onclick={onDismissCancel}
                class="px-2 py-1.5 bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg hover:bg-slate-300"
              >
                No
              </button>
            </div>
          {:else}
            <button
              onclick={onStartCancel}
              class="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
              title="Cancelar reserva y liberar asientos"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Anular</span>
            </button>
          {/if}
        {/if}
      {/if}
    </div>
  </div>
</div>
