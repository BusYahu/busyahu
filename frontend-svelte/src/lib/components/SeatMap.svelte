<script>
  import { seatStore, nav, auth, modal } from '../stores.js';
  import { ArrowLeft, Train, Loader2, Check, ShoppingCart } from 'lucide-svelte';

  export let train = null;
  export let date = null;

  let selectedCarriage = 0;

  $: if (train && date) {
    seatStore.loadSeatMap(train.id || train.code, date);
  }

  $: seatMap = $seatStore.seatMap;
  $: carriages = seatMap?.carriages || [];
  $: selectedSeats = $seatStore.selectedSeats;
  $: totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  function handleSeatClick(seat) {
    if (seat.status === 'ocupado') return;
    seatStore.toggleSeat(seat);
  }

  function handleContinue() {
    if (selectedSeats.length === 0) return;
    if (!$auth.user) {
      modal.openAuth();
      return;
    }
    nav.navigate('payment', { train, date, seats: selectedSeats, totalPrice });
  }

  function handleBack() {
    seatStore.clear();
    nav.navigate('search');
  }

  function getSeatColor(seat) {
    if (seat.status === 'ocupado') return 'bg-slate-600 cursor-not-allowed';
    if (selectedSeats.find(s => s.seatNumber === seat.seatNumber)) return 'bg-emerald-500 ring-2 ring-emerald-400';
    return 'bg-slate-700 hover:bg-slate-600 cursor-pointer';
  }

  function getClassBadge(classType) {
    return classType === 'First'
      ? 'bg-yellow-500/20 text-yellow-400'
      : 'bg-blue-500/20 text-blue-400';
  }
</script>

<div class="max-w-6xl mx-auto p-6">
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
        <Train class="w-6 h-6 text-emerald-400" />
        Seleccionar Asientos
      </h2>
      {#if train}
        <p class="text-slate-400">{train.name} ({train.code}) - {date}</p>
      {/if}
    </div>
  </div>

  <!-- Loading -->
  {#if $seatStore.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 text-emerald-400 animate-spin" />
      <span class="ml-3 text-slate-400">Cargando mapa de asientos...</span>
    </div>
  <!-- Error -->
  {:else if $seatStore.error}
    <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <p class="text-red-400">{$seatStore.error}</p>
    </div>
  {:else if seatMap}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Seat Map -->
      <div class="lg:col-span-2">
        <!-- Carriage Tabs -->
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
          {#each carriages as carriage, i}
            <button
              class="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap
                {selectedCarriage === i
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}"
              on:click={() => selectedCarriage = i}
            >
              Vagón {carriage.carriageNumber}
              <span class="ml-2 text-xs px-2 py-0.5 rounded {getClassBadge(carriage.classType)}">
                {carriage.classType}
              </span>
            </button>
          {/each}
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mb-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-slate-700"></div>
            <span class="text-slate-400">Disponible</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-emerald-500"></div>
            <span class="text-slate-400">Seleccionado</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-slate-600"></div>
            <span class="text-slate-400">Ocupado</span>
          </div>
        </div>

        <!-- Seat Grid -->
        {#if carriages[selectedCarriage]}
          {@const carriage = carriages[selectedCarriage]}
          <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <!-- Column Headers -->
            <div class="flex justify-center gap-2 mb-4">
              <div class="w-16"></div>
              {#each ['A', 'B', 'C', 'D', 'E'] as col}
                <div class="w-12 text-center text-sm font-medium text-slate-400">{col}</div>
              {/each}
            </div>

            <!-- Seats by Row -->
            {#each Array(carriage.seats[0]?.row ? Math.max(...carriage.seats.map(s => s.row)) : 0) as _, rowIndex}
              {@const row = rowIndex + 1}
              {@const rowSeats = carriage.seats.filter(s => s.row === row)}
              <div class="flex justify-center gap-2 mb-2">
                <div class="w-16 flex items-center justify-end pr-2 text-sm text-slate-400">
                  Fila {row}
                </div>
                {#each rowSeats as seat}
                  <button
                    class="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-medium transition-all {getSeatColor(seat)}"
                    on:click={() => handleSeatClick(seat)}
                    disabled={seat.status === 'ocupado'}
                    title="{seat.seatNumber} - {seat.classType} - ${seat.price}"
                  >
                    {seat.seatNumber.split('-')[1]}
                  </button>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Selection Summary -->
      <div class="lg:col-span-1">
        <div class="bg-slate-800 rounded-xl p-6 border border-slate-700 sticky top-24">
          <h3 class="text-lg font-bold text-white mb-4">Resumen</h3>

          {#if selectedSeats.length > 0}
            <div class="space-y-2 mb-4">
              {#each selectedSeats as seat}
                <div class="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                  <div>
                    <span class="font-medium text-white">{seat.seatNumber}</span>
                    <span class="text-xs ml-2 px-2 py-0.5 rounded {getClassBadge(seat.classType)}">
                      {seat.classType}
                    </span>
                  </div>
                  <span class="text-emerald-400">${seat.price.toFixed(2)}</span>
                </div>
              {/each}
            </div>

            <div class="border-t border-slate-700 pt-4 mb-4">
              <div class="flex justify-between text-lg">
                <span class="text-slate-300">Total:</span>
                <span class="font-bold text-emerald-400">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              on:click={handleContinue}
            >
              <ShoppingCart class="w-5 h-5" />
              Continuar al Pago
            </button>
          {:else}
            <p class="text-slate-400 text-center py-4">
              Seleccioná al menos un asiento para continuar
            </p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
