import { SEAT_CLASSES, priceForClass, type SeatClass } from './seatClasses';

interface SeatClassSelectorProps {
  basePrice: number;
  currencySymbol: string;
  selectedClass: SeatClass;
  onSelect: (seatClass: SeatClass) => void;
}

export function SeatClassSelector({
  basePrice,
  currencySymbol,
  selectedClass,
  onSelect,
}: SeatClassSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
        1. Elige la Clase del Vagón
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SEAT_CLASSES.map((option) => {
          const isSelected = selectedClass === option.id;
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-black text-slate-900">{option.name}</div>
              <div className="text-base font-extrabold text-indigo-700 mt-1">
                {currencySymbol}
                {priceForClass(basePrice, option.id)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{option.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
