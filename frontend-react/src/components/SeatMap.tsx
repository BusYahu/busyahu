import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { TrainRoute } from '../types';
import { SeatClassSelector } from './seats/SeatClassSelector';
import { SeatGrid } from './seats/SeatGrid';
import { SeatLegend } from './seats/SeatLegend';
import { SeatSummaryBar } from './seats/SeatSummaryBar';
import { priceForClass, type SeatClass } from './seats/seatClasses';

interface SeatMapProps {
  train: TrainRoute;
  date: string;
  currencySymbol: string;
  onBack: () => void;
  onConfirmSeats: (seats: string[], seatClass: SeatClass, price: number) => void;
}

export function SeatMap({ train, date, currencySymbol, onBack, onConfirmSeats }: SeatMapProps) {
  const [selectedClass, setSelectedClass] = useState<SeatClass>('tourist');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['1-A']);

  const currentSeatPrice = priceForClass(train.basePrice, selectedClass);

  const toggleSeat = (seatId: string) => {
    setSelectedSeats((previous) =>
      previous.includes(seatId)
        ? previous.filter((seat) => seat !== seatId)
        : [...previous, seatId],
    );
  };

  const handleClassSelect = (seatClass: SeatClass) => {
    setSelectedClass(seatClass);
    setSelectedSeats(['1-A']);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Horarios
        </button>
        <div className="text-left sm:text-right">
          <div className="text-sm font-black text-slate-900">
            {train.operator} — {train.trainModel}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {train.fromCity} ➔ {train.toCity} • Fecha: {date}
          </div>
        </div>
      </div>

      <SeatClassSelector
        basePrice={train.basePrice}
        currencySymbol={currencySymbol}
        selectedClass={selectedClass}
        onSelect={handleClassSelect}
      />

      <SeatLegend onAutoSelect={() => setSelectedSeats(['1-A', '1-B'])} />

      <SeatGrid selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />

      <SeatSummaryBar
        selectedCount={selectedSeats.length}
        totalPrice={currentSeatPrice * selectedSeats.length}
        currencySymbol={currencySymbol}
        onConfirm={() => onConfirmSeats(selectedSeats, selectedClass, currentSeatPrice)}
      />
    </div>
  );
}
