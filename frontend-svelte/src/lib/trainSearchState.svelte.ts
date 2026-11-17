import type { Destination, TrainRoute } from '../types';
import {
  filterTrains,
  persistSearchState,
  readInitialSearchState,
  scrollToTrainResults,
  type SeatClassTier,
  type SortBy,
  type TimeFilter,
} from './searchFilters';

export function createTrainSearchState(
  getDestinations: () => Destination[],
  getTrains: () => TrainRoute[],
) {
  const initial = readInitialSearchState();
  let selectedCountryId = $state(initial.selectedCountryId);
  let fromCity = $state(initial.fromCity);
  let toCity = $state(initial.toCity);
  let travelDate = $state(initial.travelDate);
  let passengerCount = $state(initial.passengerCount);
  let selectedClassTier = $state<SeatClassTier>(initial.selectedClassTier);
  let timeFilter = $state<TimeFilter>('all');
  let sortBy = $state<SortBy>('price_asc');

  const currentDestination = $derived(
    getDestinations().find((destination) => destination.id === selectedCountryId) ||
      getDestinations()[0],
  );
  const currentCurrencySymbol = $derived(currentDestination?.currencySymbol || '€');
  const filteredTrains = $derived(
    filterTrains(getTrains(), currentDestination, fromCity, toCity, timeFilter, sortBy),
  );

  $effect(() => {
    persistSearchState({
      selectedCountryId,
      fromCity,
      toCity,
      travelDate,
      passengerCount,
      selectedClassTier,
    });
  });

  $effect(() => {
    const cities = currentDestination?.cities ?? [];
    if (!cities.length) return;
    if (!cities.some((city) => city.name === fromCity)) {
      fromCity = cities[0].name;
    }
    if (!cities.some((city) => city.name === toCity)) {
      toCity = cities[1]?.name || cities[0].name;
    }
  });

  function handleCountryChange(countryId: string) {
    selectedCountryId = countryId;
    const destination = getDestinations().find((candidate) => candidate.id === countryId);
    if (destination && destination.cities.length >= 2) {
      fromCity = destination.cities[0].name;
      toCity = destination.cities[1].name;
    }
  }

  function handleSwapCities() {
    const previousFrom = fromCity;
    fromCity = toCity;
    toCity = previousFrom;
  }

  function handleQuickRoute(countryId: string, from: string, to: string) {
    selectedCountryId = countryId;
    fromCity = from;
    toCity = to;
    scrollToTrainResults();
  }

  function handleResetResults() {
    timeFilter = 'all';
    if (currentDestination && currentDestination.cities.length >= 2) {
      fromCity = currentDestination.cities[0].name;
      toCity = currentDestination.cities[1].name;
    }
  }

  return {
    get selectedCountryId() {
      return selectedCountryId;
    },
    set selectedCountryId(value: string) {
      selectedCountryId = value;
    },
    get fromCity() {
      return fromCity;
    },
    set fromCity(value: string) {
      fromCity = value;
    },
    get toCity() {
      return toCity;
    },
    set toCity(value: string) {
      toCity = value;
    },
    get travelDate() {
      return travelDate;
    },
    set travelDate(value: string) {
      travelDate = value;
    },
    get passengerCount() {
      return passengerCount;
    },
    set passengerCount(value: number) {
      passengerCount = value;
    },
    get selectedClassTier() {
      return selectedClassTier;
    },
    set selectedClassTier(value: SeatClassTier) {
      selectedClassTier = value;
    },
    get timeFilter() {
      return timeFilter;
    },
    set timeFilter(value: TimeFilter) {
      timeFilter = value;
    },
    get sortBy() {
      return sortBy;
    },
    set sortBy(value: SortBy) {
      sortBy = value;
    },
    get currentDestination() {
      return currentDestination;
    },
    get currentCurrencySymbol() {
      return currentCurrencySymbol;
    },
    get filteredTrains() {
      return filteredTrains;
    },
    handleCountryChange,
    handleSwapCities,
    handleQuickRoute,
    handleResetResults,
  };
}
