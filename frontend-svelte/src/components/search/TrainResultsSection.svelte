<script lang="ts">
  import type { Destination, TrainRoute } from '../../types';
  import type { SeatClassTier, SortBy, TimeFilter } from '../../lib/searchFilters';
  import EmptyResults from './EmptyResults.svelte';
  import TrainResultCard from './TrainResultCard.svelte';
  import TrainResultsHeader from './TrainResultsHeader.svelte';

  interface Props {
    currentDestination?: Destination;
    trains: TrainRoute[];
    travelDate: string;
    passengerCount: number;
    fromCity: string;
    toCity: string;
    currencySymbol: string;
    timeFilter: TimeFilter;
    sortBy: SortBy;
    selectedClassTier: SeatClassTier;
    onSelectTrain: (train: TrainRoute, date: string, count: number, tier: SeatClassTier) => void;
    onReset: () => void;
  }

  let {
    currentDestination,
    trains,
    travelDate,
    passengerCount,
    fromCity,
    toCity,
    currencySymbol,
    timeFilter = $bindable(),
    sortBy = $bindable(),
    selectedClassTier = $bindable(),
    onSelectTrain,
    onReset
  }: Props = $props();
</script>

<section id="train-results-section" class="space-y-6 pt-4">
  <TrainResultsHeader
    destination={currentDestination}
    {travelDate}
    {passengerCount}
    {fromCity}
    {toCity}
    bind:timeFilter
    bind:sortBy
  />

  {#if trains.length === 0}
    <EmptyResults {fromCity} {toCity} destination={currentDestination} onReset={onReset} />
  {:else}
    <div class="space-y-4">
      {#each trains as train (train.id)}
        <TrainResultCard
          {train}
          {currencySymbol}
          bind:selectedClassTier
          onSelect={() => onSelectTrain(train, travelDate, passengerCount, selectedClassTier)}
        />
      {/each}
    </div>
  {/if}
</section>
