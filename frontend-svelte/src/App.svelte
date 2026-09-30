<script lang="ts">
  import { 
    INITIAL_DESTINATIONS, 
    INITIAL_TRAIN_ROUTES, 
    INITIAL_ISSUES 
  } from './data';
  import type { 
    TrainRoute, 
    Booking, 
    Passenger, 
    ProjectIssue, 
    Destination 
  } from './types';
  import TrainSearchView from './components/TrainSearchView.svelte';
  import SeatSelectionCheckoutView from './components/SeatSelectionCheckoutView.svelte';
  import TicketConfirmationView from './components/TicketConfirmationView.svelte';
  import MyBookingsView from './components/MyBookingsView.svelte';
  import ProjectManagementView from './components/ProjectManagementView.svelte';
  import { 
    Train, 
    Layers, 
    Ticket, 
    Search
  } from 'lucide-svelte';

  // Navigation tab state
  let currentView = $state<'search' | 'seat_selection' | 'confirmation' | 'my_bookings' | 'project_management'>('project_management');

  // Core application data state
  let destinations = $state<Destination[]>(INITIAL_DESTINATIONS);
  let trains = $state<TrainRoute[]>(INITIAL_TRAIN_ROUTES);
  let issues = $state<ProjectIssue[]>(INITIAL_ISSUES);
  let bookings = $state<Booking[]>([
    {
      id: 'BK-1001',
      bookingCode: 'RW-ES-9841',
      train: INITIAL_TRAIN_ROUTES[0], // Madrid -> Barcelona
      travelDate: '2026-09-20',
      passengers: [
        {
          fullName: 'Lucas Gómez',
          passportId: 'PAS-459201',
          seatId: '1-A',
          seatClass: 'tourist',
          price: 65,
        },
      ],
      totalPrice: 65,
      currency: 'EUR',
      createdAt: '2026-08-14 09:30',
      status: 'confirmed',
      qrPayload: 'RAILWORLD:RW-ES-9841:MAD-BCN:LUCAS_GOMEZ',
      userEmail: 'alumno@etec.um.edu.ar',
    },
  ]);

  // Selected Booking state for checkout / confirmation
  let selectedTrain = $state<TrainRoute | null>(null);
  let selectedTravelDate = $state<string>('2026-09-15');
  let selectedPassengerCount = $state<number>(1);
  let activeBooking = $state<Booking | null>(null);

  // Active Multi-framework Backend selection (Express or FastAPI)
  let activeBackend = $state<'express' | 'fastapi'>('express');

  // Handle train select
  function handleSelectTrain(train: TrainRoute, date: string, count: number) {
    selectedTrain = train;
    selectedTravelDate = date;
    selectedPassengerCount = count;
    currentView = 'seat_selection';
  }

  // Handle confirmation
  function handleConfirmBooking(passengers: Passenger[], totalPrice: number) {
    if (!selectedTrain) return;

    const dest = destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase());
    const currency = dest ? dest.currency : 'EUR';

    const newBooking: Booking = {
      id: `BK-${Date.now()}`,
      bookingCode: `RW-${selectedTrain.country.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      train: selectedTrain,
      travelDate: selectedTravelDate,
      passengers,
      totalPrice,
      currency,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'confirmed',
      qrPayload: `RAILWORLD-VERIFIED:${selectedTrain.trainNumber}:${passengers[0]?.fullName}`,
      userEmail: 'alumno@etec.um.edu.ar',
    };

    bookings = [newBooking, ...bookings];
    activeBooking = newBooking;
    currentView = 'confirmation';
  }

  // Cancel booking
  function handleCancelBooking(bookingId: string) {
    bookings = bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  }

  // View specific ticket
  function handleViewTicket(booking: Booking) {
    activeBooking = booking;
    currentView = 'confirmation';
  }

  // Update issue status
  function handleUpdateIssueStatus(issueId: string, newStatus: ProjectIssue['status']) {
    issues = issues.map((iss) => (iss.id === issueId ? { ...iss, status: newStatus } : iss));
  }

  // Confirmed bookings count
  let confirmedBookingsCount = $derived(
    bookings.filter((b) => b.status === 'confirmed').length
  );

  let currentCurrencySymbol = $derived(
    destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase())?.currencySymbol || '€'
  );

  let currentCurrencyCode = $derived(
    destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase())?.currency || 'EUR'
  );
</script>

<div class="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
  <!-- Top Navbar -->
  <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo & Project Title -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <Train class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-lg font-black tracking-tight text-white">BusYahu</span>
            <span class="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
              SVELTE 5 • RUNES
            </span>
          </div>
          <p class="text-[11px] text-slate-400 font-medium">
            11 Países • MongoDB • Express / FastAPI • Svelte 5 + Tailwind
          </p>
        </div>
      </div>

      <!-- Navigation Items -->
      <nav class="flex items-center gap-1.5 sm:gap-2">
        <button
          onclick={() => currentView = 'project_management'}
          class={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            currentView === 'project_management'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers class="w-4 h-4" />
          <span class="hidden sm:inline">Paso a Paso & Issues</span>
        </button>

        <button
          onclick={() => currentView = 'search'}
          class={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            currentView === 'search' || currentView === 'seat_selection'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Search class="w-4 h-4" />
          <span class="hidden sm:inline">Buscador de Trenes</span>
        </button>

        <button
          onclick={() => currentView = 'my_bookings'}
          class={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            currentView === 'my_bookings' || currentView === 'confirmation'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Ticket class="w-4 h-4" />
          <span class="hidden sm:inline">Mis Billetes</span>
          {#if confirmedBookingsCount > 0}
            <span class="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {confirmedBookingsCount}
            </span>
          {/if}
        </button>
      </nav>
    </div>
  </header>

  <!-- Main Workspace Body -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {#if currentView === 'project_management'}
      <ProjectManagementView
        {issues}
        onUpdateIssueStatus={handleUpdateIssueStatus}
      />
    {:else if currentView === 'search'}
      <TrainSearchView
        {destinations}
        {trains}
        {activeBackend}
        onSelectTrain={handleSelectTrain}
        onToggleBackend={(b) => activeBackend = b}
      />
    {:else if currentView === 'seat_selection' && selectedTrain}
      <SeatSelectionCheckoutView
        train={selectedTrain}
        travelDate={selectedTravelDate}
        passengerCount={selectedPassengerCount}
        currencySymbol={currentCurrencySymbol}
        currency={currentCurrencyCode}
        onBack={() => currentView = 'search'}
        onConfirmBooking={handleConfirmBooking}
      />
    {:else if currentView === 'confirmation' && activeBooking}
      <TicketConfirmationView
        booking={activeBooking}
        onBackToSearch={() => currentView = 'search'}
        onGoToMyBookings={() => currentView = 'my_bookings'}
      />
    {:else if currentView === 'my_bookings'}
      <MyBookingsView
        {bookings}
        onCancelBooking={handleCancelBooking}
        onViewTicket={handleViewTicket}
      />
    {/if}
  </main>

  <!-- Academic Footer -->
  <footer class="bg-white border-t border-slate-200 py-4 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
      <div>
        <strong>Trabajo Final - Programación 3</strong> • E.T.E.C. Universidad de Mendoza
      </div>
      <div class="flex items-center gap-3">
        <span class="font-mono">Docker Compose • MongoDB • Express • FastAPI • Svelte 5 Runes • Tailwind</span>
      </div>
    </div>
  </footer>
</div>
