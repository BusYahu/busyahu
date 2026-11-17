import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  CalendarDays,
  Globe2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import type { Destination } from '../../types';
import { HERO_SLIDES } from '../../data/landing';
import { Flag } from './Flag';

interface HeroCarouselProps {
  destinations: Destination[];
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

const SLIDE_INTERVAL = 5200;
const TRANSITION_MS = 1100;

export function HeroCarousel({
  destinations,
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
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const slideCount = HERO_SLIDES.length;

  const activeDestination = useMemo(
    () => destinations.find((destination) => destination.id === selectedCountryId) ?? destinations[0],
    [destinations, selectedCountryId],
  );
  const cities = activeDestination?.cities ?? [];
  const activeSlide = HERO_SLIDES[index % slideCount];
  const activeSlideDestination = destinations.find(
    (destination) => destination.id === activeSlide.countryId,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current >= slideCount ? current : current + 1));
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(interval);
  }, [slideCount]);

  useEffect(() => {
    if (index < slideCount) return;
    const reset = window.setTimeout(() => {
      setIsAnimating(false);
      setIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsAnimating(true));
      });
    }, TRANSITION_MS);
    return () => window.clearTimeout(reset);
  }, [index, slideCount]);

  const slides = [...HERO_SLIDES, HERO_SLIDES[0]];

  return (
    <section className="relative isolate min-h-[720px] overflow-hidden bg-slate-950 text-white sm:min-h-[760px]">
      {/* Fotocarrusel automático: se desplaza siempre hacia la izquierda. */}
      <div className="absolute inset-0">
        <div
          className="flex h-full w-full will-change-transform"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translate3d(-${(index * 100) / slides.length}%, 0, 0)`,
            transition: isAnimating ? `transform ${TRANSITION_MS}ms cubic-bezier(0.45, 0, 0.25, 1)` : 'none',
          }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={`${slide.id}-${slideIndex}`}
              className="relative h-full"
              style={{ width: `${100 / slides.length}%` }}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: slide.imagePosition ?? 'center' }}
                loading={slideIndex === 0 ? 'eager' : 'lazy'}
                fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.66)_42%,rgba(2,6,23,0.18)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/40" />

      <div className="relative z-10 mx-auto flex min-h-[720px] w-full max-w-7xl flex-col px-4 pb-20 pt-14 sm:min-h-[760px] sm:px-6 sm:pt-20 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            11 países · 33 destinos de postal
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Tu próximo viaje empieza
            <span className="block text-emerald-300">sobre las vías correctas.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-200 sm:text-base">
            Compara trenes de alta velocidad, elige tu asiento y recibe tu billete QR al instante.
            De Sevilla a Tokio, con tarifas claras y cancelación flexible.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-200 sm:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Billetes oficiales
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-300 text-amber-300" /> 4,8/5 en 48.000 viajeros
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="h-4 w-4 text-emerald-300" /> Sin cargos ocultos
            </span>
          </div>
        </div>

        {/* Tarjeta flotante translúcida de búsqueda */}
        <div className="mt-auto pt-10">
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
          </div>
        </div>
      </div>

      {/* Rótulo dinámico sincronizado con la fotografía activa */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/60 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:right-6 sm:px-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
          <Flag
            code={activeSlideDestination?.countryCode ?? activeSlide.countryId}
            country={activeSlide.country}
            className="h-5 w-7"
          />
        </span>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/55">En imagen</div>
          <div key={activeSlide.id} className="caption-in text-sm font-extrabold text-white">
            {activeSlide.landmark}, {activeSlide.city}
          </div>
          <div className="text-[10px] font-medium text-white/65">{activeSlide.country}</div>
        </div>
      </div>
    </section>
  );
}
