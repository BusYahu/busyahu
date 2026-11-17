<script lang="ts">
  import type { Booking, Destination, Passenger, TrainRoute, User } from '../../types';
  import TrainSearchView from '../TrainSearchView.svelte';
  import SeatSelectionCheckoutView from '../SeatSelectionCheckoutView.svelte';
  import TicketConfirmationView from '../TicketConfirmationView.svelte';
  import MyBookingsView from '../MyBookingsView.svelte';

  type AppView = 'search' | 'seat_selection' | 'confirmation' | 'my_bookings';
  type BackendId = 'express' | 'fastapi';
  type ClassTier = 'tourist' | 'first' | 'business';

  interface Props {
    currentView: AppView;
    destinations: Destination[];
    trains: TrainRoute[];
    activeBackend: BackendId;
    currentUser: User | null;
    selectedTrain: TrainRoute | null;
    selectedTravelDate: string;
    selectedPassengerCount: number;
    selectedClassPreference: ClassTier;
    currencySymbol: string;
    currency: string;
    bookings: Booking[];
    activeBooking: Booking | null;
    onSelectTrain: (
      train: TrainRoute,
      date: string,
      count: number,
      classTier: ClassTier,
    ) => void;
    onSwitchBackend: (backend: BackendId) => void;
    onOpenDocs: () => void;
    onOpenAuth: () => void;
    onBackToSearch: () => void;
    onConfirmBooking: (passengers: Passenger[], totalPrice: number, contactEmail?: string) => void;
    onGoToMyBookings: () => void;
    onCancelBooking: (bookingId: string) => void;
    onViewTicket: (booking: Booking) => void;
  }

  let {
    currentView,
    destinations,
    trains,
    activeBackend,
    currentUser,
    selectedTrain,
    selectedTravelDate,
    selectedPassengerCount,
    selectedClassPreference,
    currencySymbol,
    currency,
    bookings,
    activeBooking,
    onSelectTrain,
    onSwitchBackend,
    onOpenDocs,
    onOpenAuth,
    onBackToSearch,
    onConfirmBooking,
    onGoToMyBookings,
    onCancelBooking,
    onViewTicket,
  }: Props = $props();
</script>

{#if currentView === 'search'}
  <TrainSearchView
    {destinations}
    {trains}
    {activeBackend}
    {currentUser}
    {onSelectTrain}
    onToggleBackend={onSwitchBackend}
    onOpenProjectDocs={onOpenDocs}
    onOpenAuthModal={onOpenAuth}
  />
{:else if currentView === 'seat_selection' && selectedTrain}
  <SeatSelectionCheckoutView
    train={selectedTrain}
    travelDate={selectedTravelDate}
    passengerCount={selectedPassengerCount}
    initialClass={selectedClassPreference}
    onBack={onBackToSearch}
    {onConfirmBooking}
    {currencySymbol}
    {currency}
  />
{:else if currentView === 'confirmation' && activeBooking}
  <TicketConfirmationView
    booking={activeBooking}
    {onBackToSearch}
    {onGoToMyBookings}
  />
{:else if currentView === 'my_bookings'}
  <MyBookingsView
    {bookings}
    {onCancelBooking}
    {onViewTicket}
    onGoToSearch={onBackToSearch}
  />
{/if}
