interface SeatSummaryBarProps {
  selectedCount: number;
  totalPrice: number;
  currencySymbol: string;
  onConfirm: () => void;
}

export function SeatSummaryBar({
  selectedCount,
  totalPrice,
  currencySymbol,
  onConfirm,
}: SeatSummaryBarProps) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
      <div>
        <div className="text-xs text-slate-500">
          {selectedCount} {selectedCount === 1 ? 'asiento seleccionado' : 'asientos seleccionados'}
        </div>
        <div className="text-xl font-black text-slate-900">
          Total: {currencySymbol}
          {totalPrice}
        </div>
      </div>

      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onConfirm}
        className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
          selectedCount > 0
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        Confirmar y Emitir E-Ticket ({selectedCount})
      </button>
    </div>
  );
}
