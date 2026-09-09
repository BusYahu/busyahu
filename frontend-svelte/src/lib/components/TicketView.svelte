<script>
  import { nav } from '../stores.js';
  import { ArrowLeft, Download, Train, MapPin, Clock, User, CreditCard } from 'lucide-svelte';

  export let booking = null;

  function handleBack() {
    nav.navigate('bookings');
  }

  function handleDownloadQR() {
    if (!booking?.qrCode) return;

    const link = document.createElement('a');
    link.href = booking.qrCode;
    link.download = `ticket-${booking.bookingCode}.png`;
    link.click();
  }
</script>

<div class="max-w-2xl mx-auto p-6">
  <!-- Header -->
  <div class="flex items-center gap-4 mb-6">
    <button
      class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
      on:click={handleBack}
    >
      <ArrowLeft class="w-5 h-5" />
    </button>
    <h2 class="text-2xl font-bold text-white">Tu Boleto Digital</h2>
  </div>

  {#if booking}
    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      <!-- Ticket Header -->
      <div class="bg-emerald-600 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold text-white">{booking.train?.name || 'Tren'}</h3>
            <p class="text-emerald-100">{booking.train?.code || ''}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-emerald-100">Código de reserva</p>
            <p class="text-2xl font-bold text-white">{booking.bookingCode}</p>
          </div>
        </div>
      </div>

      <!-- Ticket Body -->
      <div class="p-6">
        <!-- Journey Info -->
        <div class="flex items-center justify-between mb-6 pb-6 border-b border-slate-700">
          <div class="text-center">
            <p class="text-2xl font-bold text-white">{booking.train?.departureTime || '--:--'}</p>
            <p class="text-sm text-slate-400">Salida</p>
          </div>

          <div class="flex-1 px-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-emerald-400 rounded-full"></div>
              <div class="flex-1 border-t-2 border-dashed border-slate-600 mx-2"></div>
              <Train class="w-5 h-5 text-emerald-400" />
              <div class="flex-1 border-t-2 border-dashed border-slate-600 mx-2"></div>
              <div class="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
          </div>

          <div class="text-center">
            <p class="text-2xl font-bold text-white">{booking.train?.arrivalTime || '--:--'}</p>
            <p class="text-sm text-slate-400">Llegada</p>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="flex items-start gap-3">
            <MapPin class="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p class="text-sm text-slate-400">Fecha de viaje</p>
              <p class="font-medium text-white">{booking.travelDate || booking.date}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <Clock class="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p class="text-sm text-slate-400">Duración</p>
              <p class="font-medium text-white">{booking.train?.duration || 'N/A'}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <User class="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p class="text-sm text-slate-400">Pasajero</p>
              <p class="font-medium text-white">{booking.passengers?.[0]?.fullName || 'N/A'}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <CreditCard class="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p class="text-sm text-slate-400">Total pagado</p>
              <p class="font-medium text-emerald-400">{booking.currency || 'EUR'} {booking.totalPrice?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <!-- Seats -->
        <div class="mb-6">
          <p class="text-sm text-slate-400 mb-2">Asientos</p>
          <div class="flex flex-wrap gap-2">
            {#each booking.seats || [] as seat}
              <span class="px-3 py-1 bg-slate-700 rounded-lg text-sm font-medium text-white">
                {seat}
              </span>
            {/each}
          </div>
        </div>

        <!-- QR Code -->
        {#if booking.qrCode}
          <div class="bg-white rounded-xl p-4 flex flex-col items-center">
            <img
              src={booking.qrCode}
              alt="Código QR del boleto"
              class="w-48 h-48"
            />
            <button
              class="mt-3 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
              on:click={handleDownloadQR}
            >
              <Download class="w-4 h-4" />
              Descargar QR
            </button>
          </div>
        {:else}
          <div class="bg-slate-700 rounded-xl p-4 text-center">
            <p class="text-slate-400">Código QR no disponible</p>
          </div>
        {/if}

        <!-- Status Badge -->
        <div class="mt-6 text-center">
          <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
            {booking.status === 'confirmed'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'}">
            {booking.status === 'confirmed' ? '✓ Reserva Confirmada' : '✗ Reserva Cancelada'}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex gap-4">
      <button
        class="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        on:click={() => nav.navigate('bookings')}
      >
        Ver Mis Reservas
      </button>
      <button
        class="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        on:click={() => nav.navigate('search')}
      >
        Buscar Otro Viaje
      </button>
    </div>
  {:else}
    <div class="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
      <p class="text-slate-400">No se encontró la reserva</p>
      <button
        class="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        on:click={() => nav.navigate('search')}
      >
        Volver a Buscar
      </button>
    </div>
  {/if}
</div>
