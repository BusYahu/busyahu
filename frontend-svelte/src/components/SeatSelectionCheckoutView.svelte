<script lang="ts">
  import type { TrainRoute, Passenger } from '../types';
  import { 
    ArrowLeft, 
    ShieldCheck, 
    CreditCard, 
    User, 
    AlertCircle
  } from 'lucide-svelte';

  interface Props {
    train: TrainRoute;
    travelDate: string;
    passengerCount: number;
    currencySymbol: string;
    currency: string;
    onBack: () => void;
    onConfirmBooking: (passengers: Passenger[], totalPrice: number) => void;
  }

  let {
    train,
    travelDate,
    passengerCount,
    currencySymbol = '€',
    currency = 'EUR',
    onBack,
    onConfirmBooking
  }: Props = $props();

  let selectedClass = $state<'tourist' | 'first' | 'business'>('tourist');
  let selectedSeats = $state<string[]>(['1-A']);
  let passengerNames = $state<string[]>([]);
  let passengerPassports = $state<string[]>([]);
  let cardNumber = $state('4532 •••• •••• 8891');
  let isProcessing = $state(false);

  $effect(() => {
    passengerNames = Array.from({ length: passengerCount }, (_, i) => passengerNames[i] || '');
    passengerPassports = Array.from({ length: passengerCount }, (_, i) => passengerPassports[i] || '');
  });

  // Price calculations
  let classMultiplier = $derived(
    selectedClass === 'business' ? 1.8 : selectedClass === 'first' ? 1.4 : 1.0
  );
  let singlePrice = $derived(Math.round(train.basePrice * classMultiplier));
  let totalPrice = $derived(singlePrice * passengerCount);

  // Seat grid configuration
  const rows = [1, 2, 3, 4, 5, 6];
  const columns = ['A', 'B', 'C', 'D'];
  const occupiedSeats = ['2-B', '3-A', '4-D', '5-C'];

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
  }

  function handleNameChange(index: number, val: string) {
    passengerNames[index] = val;
  }

  function handlePassportChange(index: number, val: string) {
    passengerPassports[index] = val;
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (selectedSeats.length < passengerCount) {
      alert(`Por favor selecciona ${passengerCount} asiento(s) en el mapa del tren.`);
      return;
    }

    isProcessing = true;
    setTimeout(() => {
      const passengersList: Passenger[] = passengerNames.map((name, i) => ({
        fullName: name || `Pasajero ${i + 1}`,
        passportId: passengerPassports[i] || `PAS-9823${i}`,
        seatId: selectedSeats[i] || `1-${columns[i] || 'A'}`,
        seatClass: selectedClass,
        price: singlePrice,
      }));

      onConfirmBooking(passengersList, totalPrice);
      isProcessing = false;
    }, 800);
  }
</script>

<div class="space-y-6">
  <!-- Botón Regresar y Resumen del Trayecto -->
  <div class="flex items-center gap-3">
    <button
      onclick={onBack}
      class="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Volver a la Búsqueda</span>
    </button>
    <div class="text-xs text-slate-500 font-medium">
      Configurando Reserva de Asientos • Paso 2 de 3
    </div>
  </div>

  <!-- Tarjeta de Información de Ruta Seleccionada -->
  <div class="bg-indigo-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xs bg-indigo-700/80 text-indigo-200 font-bold px-2 py-0.5 rounded">
          {train.operator}
        </span>
        <span class="text-xs font-mono font-bold text-amber-300">Tren #{train.trainNumber}</span>
      </div>
      <h3 class="text-lg font-black">{train.fromCity} ➔ {train.toCity}</h3>
      <p class="text-xs text-indigo-200 mt-0.5">
        Salida: {train.departureTime} ({train.fromStation}) • Llegada: {train.arrivalTime} ({train.toStation})
      </p>
    </div>

    <div class="flex items-center gap-6 text-right">
      <div>
        <div class="text-xs text-indigo-300">Fecha del Viaje</div>
        <div class="text-sm font-bold">{travelDate}</div>
      </div>
      <div class="border-l border-indigo-700/60 pl-6">
        <div class="text-xs text-indigo-300">Pasajeros</div>
        <div class="text-sm font-bold">{passengerCount} {passengerCount === 1 ? 'persona' : 'personas'}</div>
      </div>
    </div>
  </div>

  <!-- Formulario y Contenedor Principal -->
  <form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Columna Izquierda: Selector de Clase y Mapa de Asientos -->
    <div class="lg:col-span-7 space-y-6">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          1. Selecciona la Clase de Servicio
        </h3>

        <div class="grid grid-cols-3 gap-3">
          <button
            type="button"
            onclick={() => selectedClass = 'tourist'}
            class={`p-3 rounded-xl border text-left transition-all ${
              selectedClass === 'tourist'
                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div class="text-xs font-bold text-slate-800">Turista Estandar</div>
            <div class="text-base font-black text-indigo-600 mt-1">
              {currencySymbol}{Math.round(train.basePrice * 1.0)}
            </div>
            <div class="text-[10px] text-slate-500 mt-1">Wi-Fi & Enchufe</div>
          </button>

          <button
            type="button"
            onclick={() => selectedClass = 'first'}
            class={`p-3 rounded-xl border text-left transition-all ${
              selectedClass === 'first'
                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div class="text-xs font-bold text-slate-800">Primera Clase</div>
            <div class="text-base font-black text-indigo-600 mt-1">
              {currencySymbol}{Math.round(train.basePrice * 1.4)}
            </div>
            <div class="text-[10px] text-slate-500 mt-1">+Espacio & Silencio</div>
          </button>

          <button
            type="button"
            onclick={() => selectedClass = 'business'}
            class={`p-3 rounded-xl border text-left transition-all ${
              selectedClass === 'business'
                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div class="text-xs font-bold text-slate-800">Gran Confort / Business</div>
            <div class="text-base font-black text-indigo-600 mt-1">
              {currencySymbol}{Math.round(train.basePrice * 1.8)}
            </div>
            <div class="text-[10px] text-slate-500 mt-1">Catering a bordo</div>
          </button>
        </div>
      </div>

      <!-- Mapa Visual de Asientos de Vagón -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Asientos en Vagón 01
            </h3>
            <p class="text-xs text-slate-600">
              Debes seleccionar exactamente <strong class="text-indigo-600">{passengerCount}</strong> asiento(s).
            </p>
          </div>

          <!-- Leyenda -->
          <div class="flex items-center gap-3 text-[11px] font-medium text-slate-600">
            <span class="flex items-center gap-1">
              <span class="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300"></span> Libre
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3.5 h-3.5 rounded bg-slate-300"></span> Ocupado
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3.5 h-3.5 rounded bg-indigo-600"></span> Tu Elección
            </span>
          </div>
        </div>

        <!-- Carcasa de Vagón de Tren -->
        <div class="bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 relative max-w-md mx-auto shadow-inner">
          <div class="text-center font-mono text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-widest border-b pb-1">
            Cabina de Conducción / Frente ➔
          </div>

          <div class="space-y-3">
            {#each rows as row}
              <div class="flex items-center justify-between gap-2">
                <div class="flex gap-2">
                  {#each ['A', 'B'] as col}
                    {@const seatId = `${row}-${col}`}
                    {@const isOccupied = occupiedSeats.includes(seatId)}
                    {@const isSelected = selectedSeats.includes(seatId)}
                    <button
                      type="button"
                      disabled={isOccupied}
                      onclick={() => handleSeatClick(seatId)}
                      class={`w-11 h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                        isOccupied
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          : isSelected
                            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500 scale-105'
                            : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      <span>{seatId}</span>
                    </button>
                  {/each}
                </div>

                <div class="text-[10px] font-mono text-slate-300 select-none px-2 font-bold">
                  ||
                </div>

                <div class="flex gap-2">
                  {#each ['C', 'D'] as col}
                    {@const seatId = `${row}-${col}`}
                    {@const isOccupied = occupiedSeats.includes(seatId)}
                    {@const isSelected = selectedSeats.includes(seatId)}
                    <button
                      type="button"
                      disabled={isOccupied}
                      onclick={() => handleSeatClick(seatId)}
                      class={`w-11 h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                        isOccupied
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                          : isSelected
                            ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500 scale-105'
                            : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      <span>{seatId}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <div class="mt-4 text-center text-xs font-semibold text-slate-600">
            Asientos seleccionados: 
            <span class="font-mono text-indigo-600 font-bold ml-1">
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Ninguno'}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Columna Derecha: Datos de Pasajeros y Pago -->
    <div class="lg:col-span-5 space-y-6">
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          3. Datos de los Pasajeros
        </h3>

        <div class="space-y-4">
          {#each Array(passengerCount) as _, idx}
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <User class="w-3.5 h-3.5 text-indigo-600" />
                  Pasajero {idx + 1}
                </span>
                <span class="text-indigo-600 font-mono">
                  Asiento: {selectedSeats[idx] || 'Sin asignar'}
                </span>
              </div>

              <div>
                <label for={`pname-${idx}`} class="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  id={`pname-${idx}`}
                  type="text"
                  required
                  placeholder="Ej: Lucas Gómez"
                  value={passengerNames[idx] || ''}
                  oninput={(e) => handleNameChange(idx, (e.target as HTMLInputElement).value)}
                  class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label for={`ppass-${idx}`} class="block text-[11px] font-semibold text-slate-600 mb-1">
                  DNI / Pasaporte
                </label>
                <input
                  id={`ppass-${idx}`}
                  type="text"
                  required
                  placeholder="Ej: 45.920.182"
                  value={passengerPassports[idx] || ''}
                  oninput={(e) => handlePassportChange(idx, (e.target as HTMLInputElement).value)}
                  class="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Pasarela de Pago Simulada -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>4. Pago Simulado</span>
          <span class="text-emerald-600 flex items-center gap-1 text-[11px]">
            <ShieldCheck class="w-3.5 h-3.5" /> Entorno de Prueba
          </span>
        </h3>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 mb-4 text-xs">
          <div class="flex justify-between text-slate-600">
            <span>Tarifa Base ({passengerCount}x {currencySymbol}{train.basePrice})</span>
            <span class="font-mono">{currencySymbol}{train.basePrice * passengerCount}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Suplemento {selectedClass.toUpperCase()}</span>
            <span class="font-mono">{currencySymbol}{(singlePrice - train.basePrice) * passengerCount}</span>
          </div>
          <div class="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
            <span>Total a Pagar ({currency})</span>
            <span class="text-indigo-600 font-mono text-base">{currencySymbol}{totalPrice}</span>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <div>
            <label for="cardNumber" class="block text-[11px] font-semibold text-slate-600 mb-1">
              Tarjeta de Crédito Simulada
            </label>
            <div class="relative">
              <CreditCard class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="cardNumber"
                type="text"
                bind:value={cardNumber}
                class="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || selectedSeats.length < passengerCount}
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          {#if isProcessing}
            <span class="animate-spin text-base">⟳</span>
            <span>Generando Billetes y QR...</span>
          {:else}
            <ShieldCheck class="w-4 h-4" />
            <span>Confirmar y Emitir E-Ticket ({currencySymbol}{totalPrice})</span>
          {/if}
        </button>

        {#if selectedSeats.length < passengerCount}
          <div class="mt-2 text-center text-xs text-amber-600 font-semibold flex items-center justify-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" />
            Faltan seleccionar {passengerCount - selectedSeats.length} asiento(s)
          </div>
        {/if}
      </div>
    </div>
  </form>
</div>
