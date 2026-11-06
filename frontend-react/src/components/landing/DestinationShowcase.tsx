import React from 'react';
import { ArrowUpRight, Compass, TrainFront } from 'lucide-react';
import type { Destination } from '../../types';
import { COUNTRY_NETWORKS, HERO_SLIDES } from '../../data/landing';

interface DestinationShowcaseProps {
  destinations: Destination[];
  onSelectCountry: (countryId: string) => void;
}

export function DestinationShowcase({ destinations, onSelectCountry }: DestinationShowcaseProps) {
  return (
    <section id="destinos" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
              <Compass className="h-3.5 w-3.5 text-emerald-700" />
              Explora la red
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              11 países. Una sola forma de viajar.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              Elige un destino para cargar sus estaciones, horarios y tarifas. Cada red combina
              operadores de alta velocidad con billetes digitales y asientos seleccionables.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-800">
            <TrainFront className="h-4 w-4" />
            {destinations.length} redes conectadas
          </span>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {destinations.map((destination) => {
            const cover = HERO_SLIDES.find((slide) => slide.countryId === destination.id);
            return (
              <button
                key={destination.id}
                type="button"
                onClick={() => onSelectCountry(destination.id)}
                className="group relative h-44 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {cover && (
                  <img
                    src={cover.image}
                    alt={cover.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5" />
                <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/50 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
                  {destination.flagEmoji} {destination.countryCode}
                </span>
                <span className="absolute inset-x-4 bottom-4">
                  <span className="flex items-end justify-between gap-2">
                    <span>
                      <span className="block text-base font-black leading-tight text-white">
                        {destination.country}
                      </span>
                      <span className="mt-1 block text-[10px] font-semibold text-white/70">
                        {COUNTRY_NETWORKS[destination.id] ?? `${destination.cities.length} ciudades`}
                      </span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-emerald-500">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}

          <div className="flex h-44 flex-col justify-between rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/70 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <TrainFront className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-black text-emerald-950">¿Buscas otra ruta?</div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">
                Nuestro buscador compara horarios y tarifas de todos los operadores disponibles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
