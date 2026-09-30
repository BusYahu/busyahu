<script lang="ts">
  import type { Booking } from '../types';
  import { 
    Train, 
    Calendar, 
    Trash2, 
    QrCode, 
    Clock, 
    AlertCircle, 
    CheckCircle2,
    Ticket
  } from 'lucide-svelte';

  interface Props {
    bookings: Booking[];
    onCancelBooking: (bookingId: string) => void;
    onViewTicket: (booking: Booking) => void;
  }

  let { bookings = [], onCancelBooking, onViewTicket }: Props = $props();
</script>

<div id="my-bookings-view" class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold text-slate-900">Mis Reservas y Billetes</h2>
      <p class="text-xs sm:text-sm text-slate-600">
        Consulta tus viajes activos, códigos QR de embarque o cancela pasajes para liberar asientos.
      </p>
    </div>

    <span class="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg border border-indigo-200">
      {bookings.length} {bookings.length === 1 ? 'Viaje' : 'Viajes'} Registrados
    </span>
  </div>

  {#if bookings.length === 0}
    <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
      <Ticket class="w-10 h-10 text-slate-300 mx-auto" />
      <h3 class="text-base font-bold text-slate-800">No tienes reservas activas</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        Utiliza el buscador para encontrar trenes en los 11 países disponibles y emitir tus primeros billetes.
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each bookings as booking (booking.id)}
        {@const isCancelled = booking.status === 'cancelled'}
        <div
          class={`bg-white border rounded-2xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
            isCancelled ? 'border-slate-200 bg-slate-50/70 opacity-75' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <!-- Route details -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {booking.bookingCode}
              </span>
              <span class="text-xs text-slate-500 font-medium">
                {booking.train.country} • {booking.train.operator} ({booking.train.trainNumber})
              </span>
              {#if isCancelled}
                <span class="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                  Cancelado (Asiento Liberado)
                </span>
              {:else}
                <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3" /> Confirmado
                </span>
              {/if}
            </div>

            <div class="flex items-center gap-4 sm:gap-6">
              <div>
                <div class="text-base font-bold text-slate-900">{booking.train.fromCity}</div>
                <div class="text-xs text-slate-600">{booking.train.departureTime}</div>
              </div>

              <div class="flex flex-col items-center">
                <span class="text-[10px] text-slate-400 font-mono">{booking.travelDate}</span>
                <div class="w-16 h-0.5 bg-slate-300 my-1"></div>
              </div>

              <div>
                <div class="text-base font-bold text-slate-900">{booking.train.toCity}</div>
                <div class="text-xs text-slate-600">{booking.train.arrivalTime}</div>
              </div>
            </div>

            <!-- Passengers summary -->
            <div class="text-xs text-slate-500">
              Pasajeros: {booking.passengers.map((p) => `${p.fullName} (Asiento ${p.seatId})`).join(', ')}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 justify-end border-t md:border-t-0 pt-3 md:pt-0">
            <div class="text-right mr-2 hidden sm:block">
              <div class="text-[11px] text-slate-400">Total Pagado</div>
              <div class="text-sm font-black text-slate-800 font-mono">
                {booking.currency} {booking.totalPrice}
              </div>
            </div>

            <button
              onclick={() => onViewTicket(booking)}
              class="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <QrCode class="w-4 h-4 text-indigo-600" />
              <span>Ver E-Ticket</span>
            </button>

            {#if !isCancelled}
              <button
                onclick={() => {
                  if (confirm('¿Deseas cancelar esta reserva? Tus asientos serán liberados inmediatamente.')) {
                    onCancelBooking(booking.id);
                  }
                }}
                class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
