import {
  ArrowLeftRight,
  CalendarDays,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import type { Destination } from '../../types';

interface HeroSearchFieldsProps {
  cities: Destination['cities'];
  fromCity: string;
  toCity: string;
  travelDate: string;
  passengerCount: number;
  onFromCityChange: (city: string) => void;
  onToCityChange: (city: string) => void;
  onTravelDateChange: (date: string) => void;
  onPassengerCountChange: (count: number) => void;
  onSwapCities: () => void;
  onSearch: () => void;
}

/** Campos del buscador del hero. */
export function HeroSearchFields({
  cities,
  fromCity,
  toCity,
  travelDate,
  passengerCount,
  onFromCityChange,
  onToCityChange,
  onTravelDateChange,
  onPassengerCountChange,
  onSwapCities,
  onSearch,
}: HeroSearchFieldsProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
      className="grid grid-cols-1 items-end gap-2.5 md:grid-cols-12"
    >
      <label className="md:col-span-3">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Origen
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
          <select
            value={fromCity}
            onChange={(event) => onFromCityChange(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-bold text-slate-900 outline-none"
          >
            {cities.map((city) => (
              <option key={`from-${city.name}`} value={city.name}>
                {city.name} · {city.station}
              </option>
            ))}
          </select>
        </span>
      </label>

      <div className="flex justify-center md:col-span-1">
        <button
          type="button"
          onClick={onSwapCities}
          title="Intercambiar origen y destino"
          aria-label="Intercambiar origen y destino"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:-rotate-180 hover:border-emerald-300 hover:text-emerald-700"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      </div>

      <label className="md:col-span-3">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Destino
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
          <select
            value={toCity}
            onChange={(event) => onToCityChange(event.target.value)}
            className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-bold text-slate-900 outline-none"
          >
            {cities.map((city) => (
              <option key={`to-${city.name}`} value={city.name}>
                {city.name} · {city.station}
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className="md:col-span-2">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Fecha
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={travelDate}
            onChange={(event) => onTravelDateChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none"
          />
        </span>
      </label>

      <label className="md:col-span-1">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          Viajeros
        </span>
        <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 focus-within:border-emerald-500">
          <Users className="h-4 w-4 shrink-0 text-slate-400" />
          <select
            value={passengerCount}
            onChange={(event) => onPassengerCountChange(Number(event.target.value))}
            className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm font-bold text-slate-900 outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </span>
      </label>

      <button
        type="submit"
        className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:shadow-xl md:col-span-2"
      >
        <Search className="h-4 w-4" />
        Buscar
      </button>
    </form>
  );
}
