<script lang="ts">
  import type { Destination, TrainRoute, User } from '../types';
  import { scrollToTrainResults, type SeatClassTier } from '../lib/searchFilters';
  import { createTrainSearchState } from '../lib/trainSearchState.svelte.js';
  import HeroSection from './search/HeroSection.svelte';
  import SearchWidget from './search/SearchWidget.svelte';
  import ValueProps from './search/ValueProps.svelte';
  import AccountBanner from './search/AccountBanner.svelte';
  import DestinationsSection from './search/DestinationsSection.svelte';
  import TrainResultsSection from './search/TrainResultsSection.svelte';
  import SearchFooter from './search/SearchFooter.svelte';

  interface Props {
    destinations: Destination[];
    trains: TrainRoute[];
    activeBackend?: 'express' | 'fastapi';
    currentUser?: User | null;
    onSelectTrain: (
      train: TrainRoute,
      travelDate: string,
      passengerCount: number,
      selectedClass?: SeatClassTier,
    ) => void;
    onToggleBackend?: (backend: 'express' | 'fastapi') => void;
    onOpenProjectDocs?: () => void;
    onOpenAuthModal?: () => void;
  }

  let {
    destinations = [],
    trains = [],
    currentUser = null,
    onSelectTrain,
    onOpenProjectDocs,
    onOpenAuthModal,
  }: Props = $props();

  const search = createTrainSearchState(
    () => destinations,
    () => trains,
  );
</script>

<div id="train-search-view" class="space-y-12 pb-16 animate-fade-up">
  <div class="space-y-4">
    <HeroSection onQuickRoute={search.handleQuickRoute}>
      <SearchWidget
        {destinations}
        currentDestination={search.currentDestination}
        bind:selectedCountryId={search.selectedCountryId}
        bind:fromCity={search.fromCity}
        bind:toCity={search.toCity}
        bind:travelDate={search.travelDate}
        bind:passengerCount={search.passengerCount}
        bind:selectedClassTier={search.selectedClassTier}
        onCountryChange={search.handleCountryChange}
        onSwapCities={search.handleSwapCities}
        onSearch={scrollToTrainResults}
      />
    </HeroSection>
  </div>

  <ValueProps />
  <AccountBanner {currentUser} onOpenAuthModal={() => onOpenAuthModal?.()} />
  <DestinationsSection
    {destinations}
    selectedCountryId={search.selectedCountryId}
    onCountryChange={search.handleCountryChange}
    onQuickRoute={search.handleQuickRoute}
  />
  <TrainResultsSection
    currentDestination={search.currentDestination}
    trains={search.filteredTrains}
    travelDate={search.travelDate}
    passengerCount={search.passengerCount}
    fromCity={search.fromCity}
    toCity={search.toCity}
    currencySymbol={search.currentCurrencySymbol}
    bind:timeFilter={search.timeFilter}
    bind:sortBy={search.sortBy}
    bind:selectedClassTier={search.selectedClassTier}
    {onSelectTrain}
    onReset={search.handleResetResults}
  />
  <SearchFooter {onOpenProjectDocs} />
</div>
