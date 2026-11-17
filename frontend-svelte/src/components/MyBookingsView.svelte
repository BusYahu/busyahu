<script lang="ts">
  import type { Booking } from '../types';
  import { apiGateway } from '../lib/api.js';
  import { ArrowRight } from 'lucide-svelte';
  import BookingCard from './bookings/BookingCard.svelte';
  import EmptyBookings from './bookings/EmptyBookings.svelte';

  interface Props {
    bookings: Booking[];
    onCancelBooking: (bookingId: string) => void;
    onViewTicket: (booking: Booking) => void;
    onGoToSearch: () => void;
  }

  let { bookings = [], onCancelBooking, onViewTicket, onGoToSearch }: Props = $props();

  let cancellingId = $state<string | null>(null);
  let qrMap = $state<Record<string, string>>({});

  const todayStr = new Date().toISOString().slice(0, 10);

  const sortedBookings = $derived(
    [...bookings].sort((a, b) => {
      const aActive = a.status !== 'cancelled' && (a.travelDate || a.date || '') >= todayStr;
      const bActive = b.status !== 'cancelled' && (b.travelDate || b.date || '') >= todayStr;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (b.travelDate || b.date || '').localeCompare(a.travelDate || a.date || '');
    })
  );

  $effect(() => {
    for (const booking of bookings) {
      if (booking.qrCode || qrMap[booking.id]) continue;
      void apiGateway
        .generateQr(booking.qrPayload || booking.bookingCode)
        .then((result) => {
          if (result.qrCode) qrMap[booking.id] = result.qrCode;
        })
        .catch(() => {
          // Sin backend: el billete sigue visible sin QR.
        });
    }
  });
</script>

<div id="my-bookings-view" class="max-w-5xl mx-auto space-y-6 pb-16 animate-fade-up">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
    <div>
      <h2 class="text-2xl font-black text-slate-900 tracking-tight">Mis Billetes y Viajes</h2>
      <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
        Consulta tus pasajes emitidos, códigos QR para torniquetes de estación o cancela reservas.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-200">
        {bookings.length} {bookings.length === 1 ? 'Viaje' : 'Viajes'} en total
      </span>
      <button
        onclick={onGoToSearch}
        class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
      >
        <span>Buscar Nuevos Trenes</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>

  {#if bookings.length === 0}
    <EmptyBookings {onGoToSearch} />
  {:else}
    <div class="space-y-4">
      {#each sortedBookings as booking (booking.id)}
        <BookingCard
          {booking}
          qrSrc={booking.qrCode || qrMap[booking.id]}
          isExpired={booking.status !== 'cancelled' &&
            (booking.travelDate || booking.date || '') < todayStr}
          isConfirmingCancel={cancellingId === booking.id}
          onViewTicket={() => onViewTicket(booking)}
          onStartCancel={() => (cancellingId = booking.id)}
          onConfirmCancel={() => {
            onCancelBooking(booking.id);
            cancellingId = null;
          }}
          onDismissCancel={() => (cancellingId = null)}
        />
      {/each}
    </div>
  {/if}
</div>
