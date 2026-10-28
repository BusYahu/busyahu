<script lang="ts">
  import type { Booking } from '../types';
  import { 
    Calendar, 
    Trash2, 
    QrCode, 
    CheckCircle2,
    Ticket,
    ArrowRight,
    Clock
  } from 'lucide-svelte';

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

  // Ordena: primero los billetes vigentes, luego los vencidos/cancelados.
  // Dentro de cada grupo, por fecha de viaje descendente.
  let sortedBookings = $derived(
    [...bookings].sort((a, b) => {
      const aCancelled = a.status === 'cancelled';
      const bCancelled = b.status === 'cancelled';
      const aExpired = !aCancelled && ((a.travelDate || a.date || '') < todayStr);
      const bExpired = !bCancelled && ((b.travelDate || b.date || '') < todayStr);
      const aActive = !aCancelled && !aExpired;
      const bActive = !bCancelled && !bExpired;
      if (aActive !== bActive) return aActive ? -1 : 1;
      const da = a.travelDate || a.date || '';
      const db = b.travelDate || b.date || '';
      return db.localeCompare(da);
    })
  );

  // Genera/obtiene un QR funcional real (el mismo backend que envia el correo)
  $effect(() => {
    for (const booking of bookings) {
      if (booking.qrCode || qrMap[booking.id]) continue;
      const payload = booking.qrPayload || booking.bookingCode;
      (async () => {
        const endpoints = [
          '/api/bookings/qr',
          'http://localhost:8000/api/bookings/qr'
        ];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: payload })
            });
            if (res.ok) {
              const d = await res.json();
              if (d?.qrCode) {
                qrMap[booking.id] = d.qrCode;
              }
              break;
            }
          } catch {}
        }
      })();
    }
  });
</script>

<div id="my-bookings-view" class="max-w-5xl mx-auto space-y-6 pb-16">
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
    <div class="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
        <Ticket class="w-7 h-7" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-slate-900">Aún no tienes billetes emitidos</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Explora las conexiones de alta velocidad en nuestros 11 países y reserva tu primer viaje en minutos.
        </p>
      </div>
      <button
        onclick={onGoToSearch}
        class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center gap-2"
      >
        <span>Explorar Destinos y Trenes</span>
        <ArrowRight class="w-4 h-4" />
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each sortedBookings as booking (booking.id)}
        {@const isCancelled = booking.status === 'cancelled'}
        {@const isExpired = !isCancelled && ((booking.travelDate || booking.date || '') < todayStr)}
        {@const isConfirmingCancel = cancellingId === booking.id}
        {@const qrSrc = booking.qrCode || qrMap[booking.id]}

        <div
          class="bg-white border rounded-2xl p-5 sm:p-6 shadow-sm transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6 {isCancelled || isExpired ? 'border-slate-200 bg-slate-50/70 opacity-70' : 'border-slate-200 hover:border-slate-300'}"
        >
          <!-- Route details -->
          <div class="space-y-3 flex-1">
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                {booking.bookingCode}
              </span>
              <span class="text-xs text-slate-600 font-semibold">
                {booking.train.operator} · {booking.train.country}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                (Tren #{booking.train.trainNumber})
              </span>

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

            <!-- Cities schedule -->
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

            <!-- Passengers badges -->
            <div class="text-xs text-slate-600 flex flex-wrap items-center gap-2 pt-1">
              <span class="font-semibold text-slate-800">Pasajeros:</span>
              {#each booking.passengers as p, i}
                <span class="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                  {p.fullName} <strong class="text-indigo-600 font-mono">(Asiento {p.seatId})</strong>
                </span>
              {/each}
            </div>
          </div>

          <!-- QR preview -->
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

          <!-- Price & Actions -->
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
                  onclick={() => onViewTicket(booking)}
                  class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <QrCode class="w-4 h-4" />
                  <span>Ver Billete & QR</span>
                </button>

                {#if !isExpired}
                  {#if isConfirmingCancel}
                    <div class="flex items-center gap-1">
                    <button
                      onclick={() => {
                        onCancelBooking(booking.id);
                        cancellingId = null;
                      }}
                      class="px-2.5 py-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      Sí, anular
                    </button>
                    <button
                      onclick={() => (cancellingId = null)}
                      class="px-2 py-1.5 bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg hover:bg-slate-300"
                    >
                      No
                    </button>
                  </div>
                {:else}
                  <button
                    onclick={() => (cancellingId = booking.id)}
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
      {/each}
    </div>
  {/if}
</div>
