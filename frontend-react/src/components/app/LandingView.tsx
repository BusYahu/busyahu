import { ArrowRight, ShieldCheck, Sparkles, Train as TrainIcon } from 'lucide-react';
import type { Destination, TrainRoute } from '../../types';
import { BrandMarquee } from '../landing/BrandMarquee';
import { DestinationShowcase } from '../landing/DestinationShowcase';
import { FAQAccordion } from '../landing/FAQAccordion';
import { HeroCarousel } from '../landing/HeroCarousel';
import { HowItWorks } from '../landing/HowItWorks';
import { TrainResults } from '../landing/TrainResults';

interface LandingViewProps {
  destinations: Destination[];
  selectedCountryId: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  passengerCount: number;
  currentDestination?: Destination;
  currentCountryTrains: TrainRoute[];
  loadingCatalog: boolean;
  onSelectCountry: (countryId: string) => void;
  onFromCityChange: (city: string) => void;
  onToCityChange: (city: string) => void;
  onTravelDateChange: (date: string) => void;
  onPassengerCountChange: (count: number) => void;
  onSwapCities: () => void;
  onSearch: () => void;
  onExploreCountry: (countryId: string) => void;
  onSelectTrain: (train: TrainRoute) => void;
  onReload: () => void;
  onGoHome: () => void;
}

export function LandingView({
  destinations,
  selectedCountryId,
  fromCity,
  toCity,
  travelDate,
  passengerCount,
  currentDestination,
  currentCountryTrains,
  loadingCatalog,
  onSelectCountry,
  onFromCityChange,
  onToCityChange,
  onTravelDateChange,
  onPassengerCountChange,
  onSwapCities,
  onSearch,
  onExploreCountry,
  onSelectTrain,
  onReload,
  onGoHome,
}: LandingViewProps) {
  return (
    <>
      <HeroCarousel
        destinations={destinations}
        selectedCountryId={selectedCountryId}
        fromCity={fromCity}
        toCity={toCity}
        travelDate={travelDate}
        passengerCount={passengerCount}
        onSelectCountry={onSelectCountry}
        onFromCityChange={onFromCityChange}
        onToCityChange={onToCityChange}
        onTravelDateChange={onTravelDateChange}
        onPassengerCountChange={onPassengerCountChange}
        onSwapCities={onSwapCities}
        onSearch={onSearch}
      />
      <BrandMarquee />
      <DestinationShowcase destinations={destinations} onSelectCountry={onExploreCountry} />
      <HowItWorks />
      <TrainResults
        destination={currentDestination}
        fromCity={fromCity}
        toCity={toCity}
        travelDate={travelDate}
        trains={currentCountryTrains}
        loading={loadingCatalog}
        onSelectTrain={onSelectTrain}
        onReload={onReload}
      />
      <FAQAccordion />
      <ClosingCta onGoHome={onGoHome} />
    </>
  );
}

function ClosingCta({ onGoHome }: { onGoHome: () => void }) {
  return (
    <section className="bg-emerald-900 py-14 text-white sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-emerald-700 bg-emerald-800 px-6 py-10 shadow-2xl sm:px-10">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="absolute -bottom-20 right-28 h-56 w-56 rounded-full bg-amber-300/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-950/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Tu viaje, a un clic
              </span>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                ¿Listo para cambiar de paisaje sin cambiar de ritmo?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/80">
                Encuentra tu próximo tren, elige asiento y lleva tu billete QR en el móvil. Sin
                filas y con asistencia real cuando la necesites.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-emerald-900 shadow-xl transition-transform hover:-translate-y-0.5"
            >
              <TrainIcon className="h-4 w-4" />
              Buscar mi tren
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-emerald-100/80">
            {['Billetes oficiales', 'Cambios flexibles', 'Soporte 24/7'].map((label) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
