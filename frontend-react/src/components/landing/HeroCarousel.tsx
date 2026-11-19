import React, { useEffect, useMemo, useState } from 'react';
import type { Destination } from '../../types';
import { HERO_SLIDES } from '../../data/landing';
import { HeroCaption } from './HeroCaption';
import { HeroCopy } from './HeroCopy';
import { HeroSearchCard } from './HeroSearchCard';
import { HeroSlideshow } from './HeroSlideshow';

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
      <HeroSlideshow
        slides={slides}
        index={index}
        isAnimating={isAnimating}
        transitionMs={TRANSITION_MS}
      />

      <div className="relative z-10 mx-auto flex min-h-[720px] w-full max-w-7xl flex-col px-4 pb-20 pt-14 sm:min-h-[760px] sm:px-6 sm:pt-20 lg:px-8">
        <HeroCopy />

        <div className="mt-auto pt-10">
          <HeroSearchCard
            destinations={destinations}
            activeDestination={activeDestination}
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
        </div>
      </div>

      <HeroCaption slide={activeSlide} destination={activeSlideDestination} />
    </section>
  );
}
