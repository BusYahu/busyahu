import React, { useState } from 'react';
import { TrainRoute } from '../types';
import { ArrowLeft, Check, Wand2 } from 'lucide-react';

interface SeatMapProps {
  train: TrainRoute;
  date: string;
  currencySymbol: string;
  onBack: () => void;
  onConfirmSeats: (seats: string[], seatClass: 'tourist' | 'first' | 'business', price: number) => void;
}

export function SeatMap({
  train,
  date,
  currencySymbol,
  onBack,
  onConfirmSeats,
}: SeatMapProps) {
  const [selectedClass, setSelectedClass] = useState<'tourist' | 'first' | 'business'>('tourist');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['1-A']);

  const rows = [1, 2, 3, 4, 5, 6];
  const occupiedSeats = ['1-C', '2-B', '4-A', '5-D'];

  const multiplier = selectedClass === 'business' ? 1.8 : selectedClass === 'first' ? 1.4 : 1.0;
  const currentSeatPrice = Math.round(train.basePrice * multiplier);

  const toggleSeat = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const autoSelect = () => {
    setSelectedSeats(['1-A', '1-B']);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 max-w-3xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Horarios
        </button>
        <div className="text-left sm:text-right">
          <div className="text-sm font-black text-slate-900">{train.operator} — {train.trainModel}</div>
          <div className="text-xs text-slate-500 font-mono">
            {train.fromCity} ➔ {train.toCity} • Fecha: {date}
          </div>
        </div>
      </div>

      {/* Selector de Clases */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          1. Elige la Clase del Vagón
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'tourist', name: 'Turista Standard', mult: 1.0, desc: 'Wi-Fi 5G y toma USB' },
            { id: 'first', name: 'Primera Clase', mult: 1.4, desc: 'Asiento ancho + Silencio' },
            { id: 'business', name: 'Club / Business', mult: 1.8, desc: 'Catering en asiento' },
          ].map((c) => {
            const isSelected = selectedClass === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setSelectedClass(c.id as any);
                  setSelectedSeats(['1-A']);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-black text-slate-900">{c.name}</div>
                <div className="text-base font-extrabold text-indigo-700 mt-1">
                  {currencySymbol}{Math.round(train.basePrice * c.mult)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Referencias */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600 pt-2">
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-white border border-slate-300" />
            <span>Libre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
            <span className="font-bold text-slate-900">Tu Asiento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-md bg-slate-400 opacity-60" />
            <span>Ocupado</span>
          </div>
        </div>

        <button
          type="button"
          onClick={autoSelect}
          className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Wand2 className="w-3 h-3 text-amber-600" /> Autoseleccionar 2 Asientos
        </button>
      </div>

      {/* Matriz del Vagón */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-inner relative overflow-hidden">
        <div className="text-center text-[10px] font-mono tracking-widest text-indigo-300 uppercase mb-4">
          ▲▲ Locomotora (Sentido de Marcha) ▲▲
        </div>

        <div className="max-w-xs mx-auto space-y-2.5">
          {rows.map((row) => (
            <div key={row} className="flex items-center justify-between gap-2">
              {/* Asiento A y B */}
              {['A', 'B'].map((col) => {
                const id = `${row}-${col}`;
                const isOcc = occupiedSeats.includes(id);
                const isSel = selectedSeats.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    disabled={isOcc}
                    onClick={() => toggleSeat(id)}
                    className={`w-11 h-11 rounded-xl text-xs font-bold font-mono transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-105 ring-2 ring-indigo-300'
                        : isOcc
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-indigo-100 text-slate-900 border border-slate-300'
                    }`}
                  >
                    <span>{id}</span>
                    <span className="text-[8px] font-normal opacity-70">{col === 'A' ? 'Vent.' : 'Pas.'}</span>
                  </button>
                );
              })}

              {/* Pasillo */}
              <div className="text-[10px] font-mono text-slate-400 font-bold px-2 py-1 bg-slate-900 rounded">
                Fila {row}
              </div>

              {/* Asiento C y D */}
              {['C', 'D'].map((col) => {
                const id = `${row}-${col}`;
                const isOcc = occupiedSeats.includes(id);
                const isSel = selectedSeats.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    disabled={isOcc}
                    onClick={() => toggleSeat(id)}
                    className={`w-11 h-11 rounded-xl text-xs font-bold font-mono transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-105 ring-2 ring-indigo-300'
                        : isOcc
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-indigo-100 text-slate-900 border border-slate-300'
                    }`}
                  >
                    <span>{id}</span>
                    <span className="text-[8px] font-normal opacity-70">{col === 'D' ? 'Vent.' : 'Pas.'}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Pie con Resumen y Botón Continuar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div>
          <div className="text-xs text-slate-500">
            {selectedSeats.length} {selectedSeats.length === 1 ? 'asiento seleccionado' : 'asientos seleccionados'}
          </div>
          <div className="text-xl font-black text-slate-900">
            Total: {currencySymbol}{currentSeatPrice * selectedSeats.length}
          </div>
        </div>

        <button
          type="button"
          disabled={selectedSeats.length === 0}
          onClick={() => onConfirmSeats(selectedSeats, selectedClass, currentSeatPrice)}
          className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
            selectedSeats.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Confirmar y Emitir E-Ticket ({selectedSeats.length})
        </button>
      </div>

    </div>
  );
}