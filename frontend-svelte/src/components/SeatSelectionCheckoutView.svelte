<script lang="ts">
  import type { TrainRoute, Passenger } from '../types';
  import { 
    ArrowLeft, 
    ShieldCheck, 
    CreditCard, 
    User, 
    Check, 
    AlertCircle,
    Luggage,
    Train,
    Clock,
    Lock
  } from 'lucide-svelte';

  interface Props {
    train: TrainRoute;
    travelDate: string;
    passengerCount: number;
    initialClass?: 'tourist' | 'first' | 'business';
    currencySymbol?: string;
    currency?: string;
    onBack: () => void;
    onConfirmBooking: (passengers: Passenger[], totalPrice: number) => void;
  }

  let {
    train,
    travelDate,
    passengerCount,
    initialClass = 'tourist',
    currencySymbol = '€',
    currency = 'EUR',
    onBack,
    onConfirmBooking
  }: Props = $props();

  let selectedClass = $state<'tourist' | 'first' | 'business'>('tourist');
  let selectedSeats = $state<string[]>(['2-A']);
  let passengerNames = $state<string[]>([]);
  let passengerPassports = $state<string[]>([]);
  let contactEmail = $state('viajero@busyahurail.com');
  let selectedCarriage = $state<number>(3);
  let paymentMethod = $state<'card' | 'bizum' | 'apple_pay'>('card');
  let cardNumber = $state('4532 •••• •••• 8891');
  let cardExpiry = $state('08/29');
  let cardCvv = $state('382');
  let isProcessing = $state(false);
  let validationError = $state<string | null>(null);

  // Sync initialClass & passenger arrays when props change
  $effect(() => {
    if (initialClass) {
      selectedClass = initialClass;
    }
  });

  $effect(() => {
    passengerNames = Array.from({ length: passengerCount }, (_, i) => passengerNames[i] || '');
    passengerPassports = Array.from({ length: passengerCount }, (_, i) => passengerPassports[i] || '');

    const defaults = ['2-A', '2-B', '3-A', '3-B', '4-A', '4-B'];
    if (selectedSeats.length === 0 || selectedSeats.length < passengerCount) {
      selectedSeats = defaults.slice(0, passengerCount);
    }
  });

  // Price calculations
  let classMultiplier = $derived(
    selectedClass === 'business' ? 1.8 : selectedClass === 'first' ? 1.4 : 1.0
  );
  let singlePrice = $derived(Math.round(train.basePrice * classMultiplier));
  let subtotal = $derived(singlePrice * passengerCount);
  let taxes = $derived(Math.round(subtotal * 0.1));
  let totalPrice = $derived(subtotal + taxes);

  // Carriage seating grid: 8 rows, columns A, B, C, D
  const rows = [1, 2, 3, 4, 5, 6, 7, 8];
  const columns = ['A', 'B', 'C', 'D'];
  const occupiedSeats = ['1-A', '1-B', '3-C', '3-D', '5-A', '6-C', '7-B'];

  function handleSeatClick(seatId: string) {
    if (occupiedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      selectedSeats = selectedSeats.filter((id) => id !== seatId);
    } else {
      if (selectedSeats.length < passengerCount) {
        selectedSeats = [...selectedSeats, seatId];
      } else {
        selectedSeats = [...selectedSeats.slice(1), seatId];
      }
    }
    validationError = null;
  }

  function handlePassengerNameChange(index: number, val: string) {
    passengerNames[index] = val;
  }

  function handlePassengerPassportChange(index: number, val: string) {
    passengerPassports[index] = val;
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (selectedSeats.length < passengerCount) {
      validationError = `Por favor selecciona ${passengerCount} asiento(s) en el plano del vagón (llevas ${selectedSeats.length}).`;
      return;
    }

    isProcessing = true;
    setTimeout(() => {
      const passengersList: Passenger[] = Array.from({ length: passengerCount }).map((_, i) => ({
        fullName: passengerNames[i]?.trim() || `Viajero ${i + 1}`,
        passportId: passengerPassports[i]?.trim() || `PAS-${Math.floor(100000 + Math.random() * 900000)}`,
        seatId: selectedSeats[i] || `2-${columns[i % 4]}`,
        seatClass: selectedClass,
        price: singlePrice,
      }));

      onConfirmBooking(passengersList, totalPrice);
      isProcessing = false;
    }, 900);
  }
</script>

<div id="seat-selection-view" class="max-w-6xl mx-auto space-y-8 pb-16">
  <!-- Top Breadcrumb & Stepper -->
  <div class="flex items-center justify-between">
    <button
      onclick={onBack}
      class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Volver a la búsqueda de trenes</span>
    </button>

    <div class="hidden sm:flex items-center gap-3 text-xs font-bold text-slate-500">
      <span class="text-emerald-600 flex items-center gap-1">
        <Check class="w-3.5 h-3.5" /> 1. Tren Seleccionado
      </span>
      <span>➔</span>
      <span class="text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
        2. Asiento y Pasajeros
      </span>
      <span>➔</span>
      <span class="text-slate-400">3. Billete Emitido</span>
    </div>
  </div>

  <!-- Train summary banner -->
  <div class="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="space-y-1">
      <div class="flex items-center gap-2 text-xs text-indigo-300 font-mono">
        <Train class="w-4 h-4" />
        <span>{train.operator} · {train.trainModel}</span>
        <span>·</span>
        <span>Tren #{train.trainNumber}</span>
      </div>
      <h2 class="text-2xl font-black tracking-tight text-white">
        {train.fromCity} ➔ {train.toCity}
      </h2>
      <div class="flex items-center gap-4 text-xs text-slate-300 pt-1">
        <span class="flex items-center gap-1">
          <Clock class="w-3.5 h-3.5 text-indigo-400" /> Salida: {train.departureTime} · Llegada: {train.arrivalTime} ({train.duration})
        </span>
        <span>·</span>
        <span>Fecha: {travelDate}</span>
      </div>
    </div>

    <!-- Class Selector -->
    <div class="bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
        Clase de Viaje:
      </div>
      <div class="flex gap-1">
        <button
          type="button"
          onclick={() => (selectedClass = 'tourist')}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors {selectedClass === 'tourist' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}"
        >
          Turista
        </button>
        <button
          type="button"
          onclick={() => (selectedClass = 'first')}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors {selectedClass === 'first' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}"
        >
          Primera
        </button>
        <button
          type="button"
          onclick={() => (selectedClass = 'business')}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors {selectedClass === 'business' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}"
        >
          Gran Clase
        </button>
      </div>
    </div>
  </div>

  <!-- Form & Layout -->
  <form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    <!-- Left Column: Carriage & Passengers -->
    <div class="lg:col-span-7 space-y-8">
      <!-- Carriage Map -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Selección de Asientos en el Vagón</span>
              <span class="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200">
                Coche 0{selectedCarriage}
              </span>
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Haz clic para elegir los {passengerCount} asiento(s) deseados.
            </p>
          </div>

          <!-- Carriage switcher -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
            <span class="text-slate-500 px-1">Coche:</span>
            {#each [2, 3, 4] as car}
              <button
                type="button"
                onclick={() => (selectedCarriage = car)}
                class="px-2.5 py-1 rounded-md transition-colors {selectedCarriage === car ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
              >
                0{car}
              </button>
            {/each}
          </div>
        </div>

        <div class="bg-slate-100 text-slate-600 py-1.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200">
          <span>◀ Dirección de la marcha / Locomotora frente</span>
        </div>

        <!-- Wagon Visual Box -->
        <div class="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 relative">
          <div class="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest pb-3 px-4 border-b border-dashed border-slate-200">
            <span>Ventana (Lado A)</span>
            <span>Pasillo Central</span>
            <span>Ventana (Lado D)</span>
          </div>

          <!-- Seat Grid -->
          <div class="space-y-3 pt-4">
            {#each rows as row}
              <div class="flex items-center justify-between gap-2">
                <!-- Left Pair A & B -->
                <div class="flex gap-2">
                  {#each ['A', 'B'] as col}
                    {@const seatId = `${row}-${col}`}
                    {@const isOccupied = occupiedSeats.includes(seatId)}
                    {@const isSelected = selectedSeats.includes(seatId)}

                    <button
                      type="button"
                      disabled={isOccupied}
                      onclick={() => handleSeatClick(seatId)}
                      class="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative {isOccupied ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : isSelected ? 'bg-indigo-600 text-white shadow-md scale-105 border-2 border-indigo-700' : 'bg-white text-slate-800 border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-sm'}"
                    >
                      <span class="text-[11px] leading-tight">{seatId}</span>
                      {#if isOccupied}
                        <Lock class="w-2.5 h-2.5 mt-0.5 opacity-60" />
                      {/if}
                      {#if isSelected}
                        <Check class="w-2.5 h-2.5 mt-0.5 text-white" />
                      {/if}
                    </button>
                  {/each}
                </div>

                <!-- Aisle Label -->
                <div class="text-[11px] font-mono font-bold text-slate-400 w-8 text-center">
                  Fila {row}
                </div>

                <!-- Right Pair C & D -->
                <div class="flex gap-2">
                  {#each ['C', 'D'] as col}
                    {@const seatId = `${row}-${col}`}
                    {@const isOccupied = occupiedSeats.includes(seatId)}
                    {@const isSelected = selectedSeats.includes(seatId)}

                    <button
                      type="button"
                      disabled={isOccupied}
                      onclick={() => handleSeatClick(seatId)}
                      class="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative {isOccupied ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : isSelected ? 'bg-indigo-600 text-white shadow-md scale-105 border-2 border-indigo-700' : 'bg-white text-slate-800 border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-sm'}"
                    >
                      <span class="text-[11px] leading-tight">{seatId}</span>
                      {#if isOccupied}
                        <Lock class="w-2.5 h-2.5 mt-0.5 opacity-60" />
                      {/if}
                      {#if isSelected}
                        <Check class="w-2.5 h-2.5 mt-0.5 text-white" />
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <!-- Legend -->
          <div class="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 font-medium">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-md bg-white border border-slate-300 shadow-sm"></div>
              <span>Disponible</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-md bg-indigo-600 border border-indigo-700 shadow-sm"></div>
              <span class="font-bold text-indigo-900">Seleccionado</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center">
                <Lock class="w-2.5 h-2.5 text-slate-400" />
              </div>
              <span>Ocupado</span>
            </div>
          </div>
        </div>

        {#if validationError}
          <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        {/if}
      </div>

      <!-- Passenger details form -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
            <User class="w-5 h-5 text-indigo-600" />
            <span>Datos de los Viajeros</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Obligatorio para la emisión del billete nominativo oficial.
          </p>
        </div>

        <div class="space-y-4">
          {#each Array.from({ length: passengerCount }) as _, idx}
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">
                    {idx + 1}
                  </span>
                  <span>Viajero {idx + 1}</span>
                </span>
                <span class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono text-[11px]">
                  Asiento: {selectedSeats[idx] || 'Por seleccionar'}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">
                    Nombre y Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Lucas Gómez"
                    value={passengerNames[idx] || ''}
                    oninput={(e) => handlePassengerNameChange(idx, (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">
                    DNI / Pasaporte
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 45920188A"
                    value={passengerPassports[idx] || ''}
                    oninput={(e) => handlePassengerPassportChange(idx, (e.target as HTMLInputElement).value)}
                    class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          {/each}

          <div class="pt-2">
            <label class="block text-xs font-bold text-slate-700 mb-1">
              Email para recibir los billetes electrónicos en PDF
            </label>
            <input
              type="email"
              bind:value={contactEmail}
              class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Order Summary & Checkout -->
    <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
        <h3 class="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Resumen de la Compra</span>
          <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Oficial
          </span>
        </h3>

        <!-- Itinerary -->
        <div class="space-y-3 text-xs">
          <div class="flex justify-between text-slate-600">
            <span class="font-semibold text-slate-800">Ruta:</span>
            <span class="font-bold text-slate-900">{train.fromCity} ➔ {train.toCity}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="font-semibold text-slate-800">Fecha:</span>
            <span>{travelDate}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="font-semibold text-slate-800">Horario:</span>
            <span>{train.departureTime} ➔ {train.arrivalTime} ({train.duration})</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="font-semibold text-slate-800">Clase:</span>
            <span class="capitalize font-bold text-indigo-700">{selectedClass}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span class="font-semibold text-slate-800">Asientos asignados:</span>
            <span class="font-mono font-bold text-slate-900">
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Pendiente'}
            </span>
          </div>
        </div>

        <!-- Breakdown -->
        <div class="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <div class="flex justify-between text-slate-600">
            <span>Billete ({passengerCount} x {singlePrice} {currencySymbol}):</span>
            <span class="tabular-nums font-semibold">{subtotal} {currencySymbol}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Reserva de asiento en vagón:</span>
            <span class="text-emerald-700 font-bold">GRATIS</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Gastos de gestión e IVA (10%):</span>
            <span class="tabular-nums font-semibold">{taxes} {currencySymbol}</span>
          </div>
          <div class="pt-3 border-t border-slate-200 flex justify-between items-baseline">
            <span class="text-sm font-black text-slate-900">Total a pagar:</span>
            <div class="text-right">
              <span class="text-2xl font-black text-slate-900 tabular-nums">
                {totalPrice} {currencySymbol}
              </span>
              <span class="block text-[10px] text-slate-400 font-mono">Moneda: {currency}</span>
            </div>
          </div>
        </div>

        <!-- Payment selector -->
        <div class="pt-4 border-t border-slate-100 space-y-3">
          <label class="block text-xs font-bold text-slate-700">
            Método de Pago Seguro
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              onclick={() => (paymentMethod = 'card')}
              class="p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all {paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
            >
              <CreditCard class="w-4 h-4" />
              <span>Tarjeta</span>
            </button>
            <button
              type="button"
              onclick={() => (paymentMethod = 'bizum')}
              class="p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all {paymentMethod === 'bizum' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
            >
              <span class="text-xs font-black">Bizum</span>
              <span class="text-[10px]">Instantáneo</span>
            </button>
            <button
              type="button"
              onclick={() => (paymentMethod = 'apple_pay')}
              class="p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all {paymentMethod === 'apple_pay' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
            >
              <span class="text-xs font-black">Pay</span>
              <span class="text-[10px]">Apple / Google</span>
            </button>
          </div>

          {#if paymentMethod === 'card'}
            <div class="space-y-2.5 pt-2">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase">
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  bind:value={cardNumber}
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 uppercase">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    bind:value={cardExpiry}
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-500 uppercase">
                    CVV
                  </label>
                  <input
                    type="text"
                    bind:value={cardCvv}
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Confirm CTA -->
        <button
          type="submit"
          disabled={isProcessing}
          class="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-400 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {#if isProcessing}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Procesando emisión oficial...</span>
          {:else}
            <ShieldCheck class="w-5 h-5" />
            <span>Confirmar y Emitir Billetes ({totalPrice} {currencySymbol})</span>
          {/if}
        </button>

        <div class="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
          <span>Conexión cifrada SSL 256 bits · Cancelación gratuita hasta 24h antes</span>
        </div>
      </div>
    </div>
  </form>
</div>
