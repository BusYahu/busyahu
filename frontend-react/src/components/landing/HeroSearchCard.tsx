import { ShieldCheck } from 'lucide-react';
import type { Destination } from '../../types';
import { Flag } from './Flag';
import { HeroSearchFields } from './HeroSearchFields';

interface HeroSearchCardProps {
  destinations: Destination[];
  activeDestination?: Destination;
  selectedCountryId: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  passengerCount: number;
  onSelectCountry: (countryId: string) => void;
  onFromCityChange: (city: string) => void;
  onToCityChange: (city: string) => void;
  onTravelDateChange: (date: string) => void;
  onPassengerCountChange: (count: number) => void;
  onSwapCities: () => void;
  onSearch: () => void;
}

/** Tarjeta flotante translúcida con el buscador principal. */
export function HeroSearchCard({
  destinations,
  activeDestination,
  selectedCountryId,
  fromCity,
  toCity,
  travelDate,
  passengerCount,
  onSelectCountry,
  onFromCityChange,
  onToCityChange,
  onTravelDateChange,
  onPassengerCountChange,
  onSwapCities,
  onSearch,
}: HeroSearchCardProps) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/90 p-4 shadow-[0_30px_80px_-20px_rgba(2,6,23,0.75)] backdrop-blur-2xl sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Flag
              code={activeDestination?.countryCode ?? selectedCountryId}
              country={activeDestination?.country}
              className="h-4 w-6"
            />
          </span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Planifica tu viaje
            </div>
            <select
              aria-label="País de destino"
              value={selectedCountryId}
              onChange={(event) => onSelectCountry(event.target.value)}
              className="mt-0.5 cursor-pointer bg-transparent text-sm font-extrabold text-slate-900 outline-none"
            >
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.country}
                </option>
              ))}
            </select>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          Precios en {activeDestination?.currencySymbol ?? '€'} · Sin cargos ocultos
        </span>
      </div>

      <HeroSearchFields
        cities={activeDestination?.cities ?? []}
        fromCity={fromCity}
        toCity={toCity}
        travelDate={travelDate}
        passengerCount={passengerCount}
        onFromCityChange={onFromCityChange}
        onToCityChange={onToCityChange}
        onTravelDateChange={onTravelDateChange}
        onPassengerCountChange={onPassengerCountChange}
        onSwapCities={onSwapCities}
        onSearch={onSearch}
      />
    </div>
  );
}
