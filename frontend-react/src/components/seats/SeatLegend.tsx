import { Wand2 } from 'lucide-react';

interface SeatLegendProps {
  onAutoSelect: () => void;
}

export function SeatLegend({ onAutoSelect }: SeatLegendProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600 pt-2">
      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-white border border-slate-300" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
            ✓
          </div>
          <span className="font-bold text-slate-900">Tu Asiento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-slate-400 opacity-60" />
          <span>Ocupado</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onAutoSelect}
        className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Wand2 className="w-3 h-3 text-amber-600" /> Autoseleccionar 2 Asientos
      </button>
    </div>
  );
}
