import { RefreshCw } from 'lucide-react';
import type { Destination } from '../../types';
import { Flag } from './Flag';

interface TrainResultsHeaderProps {
  destination?: Destination;
  fromCity: string;
  toCity: string;
  travelDate: string;
  trainCount: number;
  loading: boolean;
  onReload: () => void;
}

/** Cabecera de la sección de resultados con acción de recarga. */
export function TrainResultsHeader({
  destination,
  fromCity,
  toCity,
  travelDate,
  trainCount,
  loading,
  onReload,
}: TrainResultsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
          Resultados en vivo
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {fromCity} <span className="text-slate-300">→</span> {toCity}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Flag
            code={destination?.countryCode ?? destination?.id}
            country={destination?.country}
            className="h-3.5 w-5"
          />
          {destination?.country} · {travelDate} · {trainCount}{' '}
          {trainCount === 1 ? 'tren disponible' : 'trenes disponibles'}
        </p>
      </div>
      <button
        type="button"
        onClick={onReload}
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-emerald-300 hover:text-emerald-800"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        Actualizar horarios
      </button>
    </div>
  );
}
