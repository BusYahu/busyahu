<script lang="ts">
  import { ShieldCheck } from 'lucide-svelte';
  import type { TrainRoute } from '../../types';
  import type { SeatClassTier } from '../../lib/searchFilters';
  import PaymentPanel from './PaymentPanel.svelte';

  interface Props {
    train: TrainRoute;
    travelDate: string;
    selectedClass: SeatClassTier;
    selectedSeats: string[];
    passengerCount: number;
    singlePrice: number;
    subtotal: number;
    taxes: number;
    totalPrice: number;
    currencySymbol: string;
    currency: string;
    isProcessing: boolean;
  }

  let {
    train,
    travelDate,
    selectedClass,
    selectedSeats,
    passengerCount,
    singlePrice,
    subtotal,
    taxes,
    totalPrice,
    currencySymbol,
    currency,
    isProcessing
  }: Props = $props();
</script>

<div class="glass-card rounded-2xl p-6 shadow-md space-y-6">
  <h3 class="text-lg font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
    <span>Resumen de la Compra</span>
    <span class="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
      Oficial
    </span>
  </h3>

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

  <PaymentPanel />

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
