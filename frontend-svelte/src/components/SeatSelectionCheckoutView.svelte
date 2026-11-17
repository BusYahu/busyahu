<script lang="ts">
  import type { TrainRoute, Passenger } from '../types';
  import type { SeatClassTier } from '../lib/searchFilters';
  import CheckoutStepper from './checkout/CheckoutStepper.svelte';
  import TrainSummaryBanner from './checkout/TrainSummaryBanner.svelte';
  import CarriageSeatPicker from './checkout/CarriageSeatPicker.svelte';
  import PassengerForm from './checkout/PassengerForm.svelte';
  import OrderSummary from './checkout/OrderSummary.svelte';

  interface Props {
    train: TrainRoute;
    travelDate: string;
    passengerCount: number;
    initialClass?: SeatClassTier;
    currencySymbol?: string;
    currency?: string;
    onBack: () => void;
    onConfirmBooking: (passengers: Passenger[], totalPrice: number) => void;
  }

  let {
    train,
    travelDate,
    passengerCount,
    initialClass = 'tourist',
    currencySymbol = '€',
    currency = 'EUR',
    onBack,
    onConfirmBooking
  }: Props = $props();

  let selectedClass = $state<SeatClassTier>(initialClass);
  let selectedSeats = $state<string[]>(['2-A']);
  let passengerNames = $state<string[]>([]);
  let passengerPassports = $state<string[]>([]);
  let contactEmail = $state('viajero@busyahurail.com');
  let selectedCarriage = $state<number>(3);
  let isProcessing = $state(false);
  let validationError = $state<string | null>(null);

  const classMultiplier = $derived(
    selectedClass === 'business' ? 1.8 : selectedClass === 'first' ? 1.4 : 1.0
  );
  const singlePrice = $derived(Math.round(train.basePrice * classMultiplier));
  const subtotal = $derived(singlePrice * passengerCount);
  const taxes = $derived(Math.round(subtotal * 0.1));
  const totalPrice = $derived(subtotal + taxes);

  const columns = ['A', 'B', 'C', 'D'];

  $effect(() => {
    passengerNames = Array.from({ length: passengerCount }, (_, index) => passengerNames[index] || '');
    passengerPassports = Array.from(
      { length: passengerCount },
      (_, index) => passengerPassports[index] || ''
    );

    const defaults = ['2-A', '2-B', '3-A', '3-B', '4-A', '4-B'];
    if (selectedSeats.length === 0 || selectedSeats.length < passengerCount) {
      selectedSeats = defaults.slice(0, passengerCount);
    }
  });

  function handleSeatClick(seatId: string) {
    if (selectedSeats.includes(seatId)) {
      selectedSeats = selectedSeats.filter((id) => id !== seatId);
    } else if (selectedSeats.length < passengerCount) {
      selectedSeats = [...selectedSeats, seatId];
    } else {
      selectedSeats = [...selectedSeats.slice(1), seatId];
    }
    validationError = null;
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    if (selectedSeats.length < passengerCount) {
      validationError = `Por favor selecciona ${passengerCount} asiento(s) en el plano del vagón (llevas ${selectedSeats.length}).`;
      return;
    }

    isProcessing = true;
    setTimeout(() => {
      const passengers: Passenger[] = Array.from({ length: passengerCount }, (_, index) => ({
        fullName: passengerNames[index]?.trim() || `Viajero ${index + 1}`,
        passportId:
          passengerPassports[index]?.trim() || `PAS-${Math.floor(100000 + Math.random() * 900000)}`,
        seatId: selectedSeats[index] || `2-${columns[index % 4]}`,
        seatClass: selectedClass,
        price: singlePrice
      }));

      onConfirmBooking(passengers, totalPrice);
      isProcessing = false;
    }, 900);
  }
</script>

<div id="seat-selection-view" class="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-up">
  <CheckoutStepper {onBack} />

  <TrainSummaryBanner {train} {travelDate} bind:selectedClass />

  <form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
    <div class="lg:col-span-7 space-y-8">
      <CarriageSeatPicker
        {passengerCount}
        bind:selectedCarriage
        {selectedSeats}
        {validationError}
        onSeatClick={handleSeatClick}
      />

      <PassengerForm
        {passengerCount}
        {passengerNames}
        {passengerPassports}
        {selectedSeats}
        bind:contactEmail
        onNameChange={(index, value) => (passengerNames[index] = value)}
        onPassportChange={(index, value) => (passengerPassports[index] = value)}
      />
    </div>

    <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
      <OrderSummary
        {train}
        {travelDate}
        {selectedClass}
        {selectedSeats}
        {passengerCount}
        {singlePrice}
        {subtotal}
        {taxes}
        {totalPrice}
        {currencySymbol}
        {currency}
        {isProcessing}
      />
    </div>
  </form>
</div>
