import type { Destination, TrainRoute } from '../types';
import { readSearchFilters, saveSearchFilters } from './storage.js';

export type TimeFilter = 'all' | 'morning' | 'afternoon' | 'evening';
export type SortBy = 'price_asc' | 'duration_asc' | 'departure_asc';
export type SeatClassTier = 'tourist' | 'first' | 'business';

export interface SearchState {
  selectedCountryId: string;
  fromCity: string;
  toCity: string;
  travelDate: string;
  passengerCount: number;
  selectedClassTier: SeatClassTier;
}

function matchesTime(departureTime: string, filter: TimeFilter): boolean {
  if (filter === 'all') return true;
  const hour = parseInt(departureTime.split(':')[0], 10);
  if (filter === 'morning') return hour >= 6 && hour < 12;
  if (filter === 'afternoon') return hour >= 12 && hour < 18;
  return hour >= 18 || hour < 6;
}

export function filterTrains(
  trains: TrainRoute[],
  destination: Destination | undefined,
  fromCity: string,
  toCity: string,
  timeFilter: TimeFilter,
  sortBy: SortBy
): TrainRoute[] {
  return trains
    .filter((train) => {
      const matchCountry = destination
        ? train.country.toLowerCase() === destination.country.toLowerCase()
        : true;
      const matchFrom = fromCity ? train.fromCity.toLowerCase() === fromCity.toLowerCase() : true;
      const matchTo = toCity ? train.toCity.toLowerCase() === toCity.toLowerCase() : true;
      return matchCountry && matchFrom && matchTo && matchesTime(train.departureTime, timeFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
      if (sortBy === 'departure_asc') return a.departureTime.localeCompare(b.departureTime);
      if (sortBy === 'duration_asc') return a.duration.localeCompare(b.duration);
      return 0;
    });
}

export function readInitialSearchState(): SearchState {
  const stored = readSearchFilters();
  return {
    selectedCountryId: stored.countryId ? String(stored.countryId) : 'es',
    fromCity: stored.fromCity ? String(stored.fromCity) : 'Madrid',
    toCity: stored.toCity ? String(stored.toCity) : 'Barcelona',
    travelDate: stored.travelDate
      ? String(stored.travelDate)
      : new Date().toISOString().slice(0, 10),
    passengerCount: stored.passengerCount ? Number(stored.passengerCount) : 1,
    selectedClassTier: stored.selectedClass || 'tourist'
  };
}

export function persistSearchState(state: SearchState): void {
  saveSearchFilters({
    countryId: state.selectedCountryId,
    fromCity: state.fromCity,
    toCity: state.toCity,
    travelDate: state.travelDate,
    passengerCount: state.passengerCount,
    selectedClass: state.selectedClassTier
  });
}

export function scrollToTrainResults(): void {
  document.getElementById('train-results-section')?.scrollIntoView({ behavior: 'smooth' });
}
