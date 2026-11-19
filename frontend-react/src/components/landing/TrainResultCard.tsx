import {
  ArrowRight,
  Clock3,
  Coffee,
  PlugZap,
  TrainFront,
  Wifi,
} from 'lucide-react';
import type { Destination, TrainRoute } from '../../types';

interface TrainResultCardProps {
  train: TrainRoute;
  destination?: Destination;
  onSelectTrain: (train: TrainRoute) => void;
}

function amenityIcon(amenity: string) {
  const normalized = amenity.toLowerCase();
  if (normalized.includes('wifi') || normalized.includes('wi-fi')) return Wifi;
  if (normalized.includes('caf') || normalized.includes('bar')) return Coffee;
  if (normalized.includes('corriente') || normalized.includes('usb') || normalized.includes('eléctric')) {
    return PlugZap;
  }
  return TrainFront;
}

/** Tarjeta individual de un tren disponible. */
export function TrainResultCard({ train, destination, onSelectTrain }: TrainResultCardProps) {
  return (
    <article className="group grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg sm:p-5 lg:grid-cols-[1.35fr_1fr_auto] lg:items-center">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <TrainFront className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-950">{train.operator}</h3>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
              {train.trainNumber}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
            {train.trainModel}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {train.amenities.slice(0, 3).map((amenity) => {
              const Icon = amenityIcon(amenity);
              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                >
                  <Icon className="h-2.5 w-2.5 text-emerald-600" />
                  {amenity}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
        <div>
          <div className="text-lg font-black tracking-tight text-slate-950">{train.departureTime}</div>
          <div className="text-[10px] font-semibold text-slate-500">{train.fromCity}</div>
        </div>
        <div className="flex min-w-[70px] flex-1 flex-col items-center text-slate-400">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <Clock3 className="h-3 w-3" />
            {train.duration}
          </span>
          <span className="my-1 h-px w-full bg-slate-300" />
          <span className="text-[9px] font-bold uppercase tracking-wide">Directo</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-black tracking-tight text-slate-950">{train.arrivalTime}</div>
          <div className="text-[10px] font-semibold text-slate-500">{train.toCity}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 lg:flex-col lg:items-end lg:border-0 lg:pt-0">
        <div className="text-left lg:text-right">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Desde
          </div>
          <div className="text-2xl font-black tracking-tight text-slate-950">
            {destination?.currencySymbol ?? '€'}
            {train.basePrice.toLocaleString('es-ES')}
          </div>
          <div className="text-[10px] font-semibold text-slate-400">{train.availableSeatsCount} plazas</div>
        </div>
        <button
          type="button"
          onClick={() => onSelectTrain(train)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-900/15 transition-all hover:bg-emerald-600"
        >
          Elegir asiento
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
