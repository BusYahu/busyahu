<script lang="ts">
  import type { Booking } from '../types';
  import { 
    CheckCircle2, 
    Download, 
    Train, 
    Clock, 
    QrCode, 
    ShieldCheck,
    ArrowLeft,
    Ticket
  } from 'lucide-svelte';

  interface Props {
    booking: Booking;
    onBackToSearch: () => void;
    onGoToMyBookings: () => void;
  }

  let { booking, onBackToSearch, onGoToMyBookings }: Props = $props();

  let isDownloaded = $state(false);

  function handleDownloadTicket() {
    isDownloaded = true;
    setTimeout(() => {
      isDownloaded = false;
    }, 2500);
  }
</script>

<div id="ticket-confirmation-view" class="max-w-3xl mx-auto space-y-6">
  <!-- Top Success Banner -->
  <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
    <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
      <CheckCircle2 class="w-7 h-7" />
    </div>
    <h2 class="text-xl font-bold text-emerald-950">
      ¡Reserva Confirmada y Billete Emitido!
    </h2>
    <p class="text-xs sm:text-sm text-emerald-800">
      Tu pago simulado fue procesado con éxito. El código de reserva es{' '}
      <strong class="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
        {booking.bookingCode}
      </strong>
    </p>
  </div>

  <!-- Modern E-Ticket Boarding Pass Layout -->
  <div class="bg-white border border-slate-300 rounded-3xl overflow-hidden shadow-lg">
    <!-- Ticket Header -->
    <div class="bg-slate-900 text-white p-5 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="p-2 bg-indigo-600 rounded-lg">
          <Train class="w-5 h-5 text-white" />
        </div>
        <div>
          <div class="text-xs text-slate-400 font-mono">
            {booking.train.country} • {booking.train.operator}
          </div>
          <div class="text-base font-bold">{booking.train.trainModel}</div>
        </div>
      </div>

      <div class="text-right">
        <span class="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
          Código de Reserva
        </span>
        <div class="text-lg font-mono font-black text-amber-400">
          {booking.bookingCode}
        </div>
      </div>
    </div>

    <!-- Train Route Visual Details -->
    <div class="p-6 space-y-6">
      <div class="grid grid-cols-3 items-center text-center">
        <div class="text-left">
          <div class="text-xs text-slate-400 font-mono">ORIGEN</div>
          <div class="text-2xl font-black text-slate-900">{booking.train.fromCity}</div>
          <div class="text-xs text-slate-500">{booking.train.fromStation}</div>
          <div class="text-sm font-bold text-indigo-700 mt-1">
            {booking.train.departureTime}
          </div>
        </div>

        <div class="flex flex-col items-center">
          <span class="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Clock class="w-3 h-3" /> {booking.train.duration}
          </span>
          <div class="w-28 h-0.5 bg-slate-300 my-2 relative">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-500"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600"></div>
          </div>
          <span class="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
            Tren #{booking.train.trainNumber}
          </span>
        </div>

        <div class="text-right">
          <div class="text-xs text-slate-400 font-mono">DESTINO</div>
          <div class="text-2xl font-black text-slate-900">{booking.train.toCity}</div>
          <div class="text-xs text-slate-500">{booking.train.toStation}</div>
          <div class="text-sm font-bold text-indigo-700 mt-1">
            {booking.train.arrivalTime}
          </div>
        </div>
      </div>

      <!-- Divider Perforado de Boleto -->
      <div class="relative py-2">
        <div class="border-b-2 border-dashed border-slate-200"></div>
        <div class="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full border border-slate-300"></div>
        <div class="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full border border-slate-300"></div>
      </div>

      <!-- Pasajeros y Asientos Asignados -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
            Pasajeros y Asientos
          </h4>
          <div class="space-y-2">
            {#each booking.passengers as p, idx}
              <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-slate-900">{p.fullName}</div>
                  <div class="text-[10px] text-slate-500 font-mono">{p.passportId}</div>
                </div>
                <div class="text-right">
                  <span class="bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded text-xs">
                    Asiento {p.seatId}
                  </span>
                  <div class="text-[10px] text-slate-500 capitalize mt-0.5">{p.seatClass}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Código QR y Verificación -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div class="bg-white p-2.5 rounded-xl border border-slate-300 shadow-sm flex-shrink-0">
            <!-- Representación visual de código QR interactivo -->
            <svg class="w-24 h-24 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
              <!-- Corner TL -->
              <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
              <rect x="11" y="11" width="16" height="16" fill="white" />
              <rect x="15" y="15" width="8" height="8" fill="#4338ca" />

              <!-- Corner TR -->
              <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
              <rect x="73" y="11" width="16" height="16" fill="white" />
              <rect x="77" y="15" width="8" height="8" fill="#4338ca" />

              <!-- Corner BL -->
              <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
              <rect x="11" y="73" width="16" height="16" fill="white" />
              <rect x="15" y="77" width="8" height="8" fill="#4338ca" />

              <!-- Data Pixels Mock -->
              <rect x="40" y="8" width="8" height="8" fill="#0f172a" />
              <rect x="52" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="42" y="22" width="6" height="10" fill="#0f172a" />
              <rect x="10" y="42" width="10" height="6" fill="#0f172a" />
              <rect x="25" y="45" width="8" height="8" fill="#0f172a" />
              <rect x="45" y="45" width="12" height="12" fill="#4338ca" />
              <rect x="65" y="42" width="8" height="6" fill="#0f172a" />
              <rect x="80" y="45" width="12" height="8" fill="#0f172a" />
              <rect x="45" y="65" width="8" height="8" fill="#0f172a" />
              <rect x="60" y="68" width="12" height="6" fill="#0f172a" />
              <rect x="78" y="65" width="8" height="14" fill="#0f172a" />
              <rect x="42" y="80" width="14" height="8" fill="#0f172a" />
              <rect x="62" y="82" width="10" height="8" fill="#4338ca" />
            </svg>
          </div>

          <div class="text-xs space-y-1">
            <div class="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" /> E-Ticket Verificado
            </div>
            <p class="text-[11px] text-slate-500">
              Escanea en los torniquetes o presenta desde tu dispositivo móvil.
            </p>
            <div class="font-mono text-[10px] text-slate-400 break-all pt-1">
              {booking.qrPayload}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ticket Footer -->
    <div class="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div class="text-slate-500">
        Emitido el: <strong class="text-slate-700">{booking.createdAt}</strong> • Total:{' '}
        <strong class="text-indigo-600 font-mono text-sm">
          {booking.currency} {booking.totalPrice}
        </strong>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={handleDownloadTicket}
          class="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Download class="w-3.5 h-3.5 text-slate-600" />
          <span>{isDownloaded ? '¡Descargado en PDF!' : 'Descargar Boleto'}</span>
        </button>

        <button
          onclick={onGoToMyBookings}
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Ticket class="w-3.5 h-3.5" />
          <span>Ver Mis Billetes</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Botón Inferior para Volver -->
  <div class="text-center pt-2">
    <button
      onclick={onBackToSearch}
      class="text-xs text-slate-500 hover:text-indigo-600 font-bold inline-flex items-center gap-1"
    >
      <ArrowLeft class="w-3.5 h-3.5" /> Volver a buscar nuevos trayectos
    </button>
  </div>
</div>
