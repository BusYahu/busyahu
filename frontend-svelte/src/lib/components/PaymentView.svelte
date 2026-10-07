<script>
  import { nav, auth, bookings, seatStore } from '../stores.js';
  import { api } from '../api.js';
  import { ArrowLeft, CreditCard, Loader2, Check, AlertCircle } from 'lucide-svelte';
  import confetti from 'canvas-confetti';

  export let train = null;
  export let date = null;
  export let seats = [];
  export let totalPrice = 0;

  let passengerName = $auth.user?.name || '';
  let passportId = '';
  let processing = false;
  let success = false;
  let error = null;

  function handleBack() {
    nav.navigate('seats', { train, date });
  }

  async function handlePayment() {
    if (!passengerName || !passportId) {
      error = 'Por favor completá todos los campos';
      return;
    }

    processing = true;
    error = null;

    try {
      const passengers = seats.map(seat => ({
        fullName: passengerName,
        passportId: passportId,
        seatId: seat.seatNumber,
        seatClass: seat.classType,
        price: seat.price,
      }));

      const bookingData = {
        trainId: train.id || train.code,
        travelDate: date,
        passengers,
        totalPrice,
        currency: 'EUR',
      };

      const result = await api.createBooking(bookingData);

      success = true;

      // Fire confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Navigate to ticket after a short delay
      setTimeout(() => {
        seatStore.clear();
        nav.navigate('ticket', { booking: result });
      }, 2000);
    } catch (err) {
      error = err.message;
    } finally {
      processing = false;
    }
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
    <div>
      <h2 class="text-2xl font-bold text-white flex items-center gap-2">
        <CreditCard class="w-6 h-6 text-emerald-400" />
        Pasarela de Pago
      </h2>
      {#if train}
        <p class="text-slate-400">{train.name} - {date}</p>
      {/if}
    </div>
  </div>

  {#if success}
    <!-- Success Message -->
    <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center">
      <div class="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check class="w-8 h-8 text-white" />
      </div>
      <h3 class="text-xl font-bold text-white mb-2">¡Reserva Confirmada!</h3>
      <p class="text-slate-400">Tu billete está siendo preparado...</p>
    </div>
  {:else}
    <!-- Order Summary -->
    <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
      <h3 class="text-lg font-bold text-white mb-4">Resumen del Pedido</h3>

      <div class="space-y-2 mb-4">
        {#each seats as seat}
          <div class="flex justify-between text-slate-300">
            <span>Asiento {seat.seatNumber} ({seat.classType})</span>
            <span>${seat.price.toFixed(2)}</span>
          </div>
        {/each}
      </div>

      <div class="border-t border-slate-700 pt-4">
        <div class="flex justify-between text-xl">
          <span class="text-white font-bold">Total a pagar:</span>
          <span class="text-emerald-400 font-bold">${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Form -->
    <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 class="text-lg font-bold text-white mb-4">Datos del Pasajero</h3>

      <form on:submit|preventDefault={handlePayment} class="space-y-4">
        <div>
          <label for="passengerName" class="block text-sm font-medium text-slate-300 mb-1">
            Nombre completo
          </label>
          <input
            id="passengerName"
            type="text"
            bind:value={passengerName}
            required
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label for="passportId" class="block text-sm font-medium text-slate-300 mb-1">
            DNI / Pasaporte
          </label>
          <input
            id="passportId"
            type="text"
            bind:value={passportId}
            required
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="PAS-12345678"
          />
        </div>

        <!-- Simulated Card Input -->
        <div class="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <p class="text-sm text-slate-400 mb-3">
            <AlertCircle class="w-4 h-4 inline mr-1" />
            Pago simulado - No se procesará ningún cargo real
          </p>
          <div class="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              disabled
              class="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-400 cursor-not-allowed"
            />
            <div class="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="MM/AA"
                disabled
                class="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-400 cursor-not-allowed"
              />
              <input
                type="text"
                placeholder="CVV"
                disabled
                class="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {#if error}
          <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p class="text-sm text-red-400">{error}</p>
          </div>
        {/if}

        <button
          type="submit"
          disabled={processing}
          class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {#if processing}
            <Loader2 class="w-5 h-5 animate-spin" />
          {:else}
            <CreditCard class="w-5 h-5" />
          {/if}
          {processing ? 'Procesando pago...' : `Pagar $${totalPrice.toFixed(2)}`}
        </button>
      </form>
    </div>
  {/if}
</div>
