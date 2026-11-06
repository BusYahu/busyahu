import React from 'react';
import { Globe2, HelpCircle, MapPin, Ticket, Train, UserRound } from 'lucide-react';
import type { Destination, User } from '../../types';

interface SiteHeaderProps {
  destinations: Destination[];
  selectedCountryId: string;
  currentView: 'search' | 'seat_selection' | 'my_bookings' | 'admin';
  currentUser: User;
  bookingsCount: number;
  onSelectCountry: (countryId: string) => void;
  onGoHome: () => void;
  onGoBookings: () => void;
  onGoDestinations: () => void;
  onGoFaq: () => void;
}

export function SiteHeader({
  destinations,
  selectedCountryId,
  currentView,
  currentUser,
  bookingsCount,
  onSelectCountry,
  onGoHome,
  onGoBookings,
  onGoDestinations,
  onGoFaq,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onGoHome} className="group flex items-center gap-2.5 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 transition-transform group-hover:-rotate-3 group-hover:scale-105">
            <Train className="h-5 w-5" />
          </span>
          <span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-950">BusYahu</span>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                Rail
              </span>
            </span>
            <span className="block text-[10px] font-semibold text-slate-500">
              Billetes oficiales en 11 países
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
          <button
            type="button"
            onClick={onGoHome}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
              currentView === 'search'
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Comprar billetes
          </button>
          <button
            type="button"
            onClick={onGoDestinations}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <MapPin className="h-3.5 w-3.5" />
            Destinos
          </button>
          <button
            type="button"
            onClick={onGoFaq}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Ayuda
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 shadow-sm sm:flex">
            <Globe2 className="h-3.5 w-3.5 text-emerald-700" />
            <span className="sr-only">País</span>
            <select
              aria-label="Seleccionar país"
              value={selectedCountryId}
              onChange={(event) => onSelectCountry(event.target.value)}
              className="max-w-[112px] cursor-pointer bg-transparent text-xs font-bold text-slate-700 outline-none"
            >
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.flagEmoji} {destination.country}
                </option>
              ))}
            </select>
          </label>

          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 xl:inline-flex">
            <UserRound className="h-3 w-3 text-emerald-700" />
            {currentUser.role === 'admin' ? 'Administrador' : 'Viajero'}
          </span>

          <button
            type="button"
            onClick={onGoBookings}
            className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black transition-all ${
              currentView === 'my_bookings'
                ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                : 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-600'
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Mis Billetes</span>
            {bookingsCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-black text-slate-950">
                {bookingsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
