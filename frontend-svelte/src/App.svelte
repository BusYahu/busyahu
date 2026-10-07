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
    Ticket, 
    Search, 
    Compass,
    Layers,
    X
  } from 'lucide-svelte';

  // Navigation tab state - Default is SEARCH (Client Travel Portal)
  let currentView = $state<'search' | 'seat_selection' | 'confirmation' | 'my_bookings'>('search');

  // Academic / Project Documentation Drawer State
  let isDocsDrawerOpen = $state(false);

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
          seatId: '2-A',
          seatClass: 'tourist',
          price: 65,
        },
      ],
      totalPrice: 65,
      currency: 'EUR',
      createdAt: '2026-08-14 09:30',
      status: 'confirmed',
      qrPayload: 'RAILWORLD:RW-ES-9841:MAD-BCN:LUCAS_GOMEZ',
      userEmail: 'viajero@busyahurail.com',
    },
  ]);

  // Selected Booking state for checkout / confirmation
  let selectedTrain = $state<TrainRoute | null>(null);
  let selectedTravelDate = $state<string>('2026-09-15');
  let selectedPassengerCount = $state<number>(1);
  let selectedClassPreference = $state<'tourist' | 'first' | 'business'>('tourist');
  let activeBooking = $state<Booking | null>(null);

  // Active Multi-framework Backend selection (Express or FastAPI)
  let activeBackend = $state<'express' | 'fastapi'>('express');
  let selectedCurrency = $state<'EUR' | 'USD' | 'GBP'>('EUR');

  function handleSelectTrain(
    train: TrainRoute, 
    date: string, 
    count: number,
    classTier: 'tourist' | 'first' | 'business' = 'tourist'
  ) {
    selectedTrain = train;
    selectedTravelDate = date;
    selectedPassengerCount = count;
    selectedClassPreference = classTier;
    currentView = 'seat_selection';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleConfirmBooking(passengers: Passenger[], totalPrice: number) {
    if (!selectedTrain) return;

    const dest = destinations.find((d) => d.country.toLowerCase() === selectedTrain.country.toLowerCase());
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
      qrPayload: `BUSYAHU-TICKET:${selectedTrain.trainNumber}:${passengers[0]?.fullName}:${selectedTrain.fromCity}-${selectedTrain.toCity}`,
      userEmail: 'viajero@busyahurail.com',
    };

    bookings = [newBooking, ...bookings];
    activeBooking = newBooking;
    currentView = 'confirmation';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelBooking(bookingId: string) {
    bookings = bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  }

  function handleViewTicket(booking: Booking) {
    activeBooking = booking;
    currentView = 'confirmation';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleUpdateIssueStatus(issueId: string, newStatus: ProjectIssue['status']) {
    issues = issues.map((iss) => (iss.id === issueId ? { ...iss, status: newStatus } : iss));
  }

  let confirmedBookingsCount = $derived(
    bookings.filter((b) => b.status === 'confirmed').length
  );
</script>

<div class="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
  <!-- CONSUMER TOP NAVBAR: 3-Zone Clean Header -->
  <header class="bg-slate-950 text-white border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md bg-slate-950/95">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
      <!-- Zone 1: Brand Element -->
      <button
        onclick={() => (currentView = 'search')}
        class="flex items-center gap-2.5 text-left group"
      >
        <div class="w-10 h-10 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 flex items-center justify-center text-white shadow-md transition-colors">
          <Train class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
            BusYahu <span class="text-indigo-400 font-extrabold">Rail</span>
          </span>
          <span class="block text-[10px] text-slate-400 font-medium">
            Alta Velocidad & Billetes Oficiales
          </span>
        </div>
      </button>

      <!-- Zone 2: Navigation Links -->
      <nav class="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-bold">
        <button
          onclick={() => (currentView = 'search')}
          class="px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 {currentView === 'search' || currentView === 'seat_selection' ? 'bg-indigo-600/90 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}"
        >
          <Search class="w-4 h-4" />
          <span>Comprar Billetes</span>
        </button>

        <button
          onclick={() => {
            currentView = 'search';
            setTimeout(() => {
              const elem = document.getElementById('train-results-section');
              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }}
          class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
        >
          <Compass class="w-4 h-4" />
          <span>Explorar Destinos</span>
        </button>

        <button
          onclick={() => (currentView = 'my_bookings')}
          class="px-3 py-2 rounded-xl transition-colors flex items-center gap-2 {currentView === 'my_bookings' || currentView === 'confirmation' ? 'bg-indigo-600/90 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}"
        >
          <Ticket class="w-4 h-4" />
          <span>Mis Billetes</span>
          {#if confirmedBookingsCount > 0}
            <span class="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full tabular-nums">
              {confirmedBookingsCount}
            </span>
          {/if}
        </button>
      </nav>

      <!-- Zone 3: Actions & Academic Trigger -->
      <div class="flex items-center gap-2 sm:gap-3">
        <select
          bind:value={selectedCurrency}
          class="bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="EUR">€ EUR</option>
          <option value="USD">$ USD</option>
          <option value="GBP">£ GBP</option>
        </select>

        <button
          onclick={() => (currentView = 'my_bookings')}
          class="md:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white relative"
          title="Mis Billetes"
        >
          <Ticket class="w-4 h-4" />
          {#if confirmedBookingsCount > 0}
            <span class="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {confirmedBookingsCount}
            </span>
          {/if}
        </button>

        <button
          onclick={() => (isDocsDrawerOpen = true)}
          class="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          title="Ver Ficha Técnica Universitaria (12 Issues, Docker y Commit Conventions)"
        >
          <Layers class="w-3.5 h-3.5 text-indigo-400" />
          <span class="hidden sm:inline">Ficha Técnica</span>
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN BODY -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if currentView === 'search'}
      <TrainSearchView
        {destinations}
        {trains}
        {activeBackend}
        onSelectTrain={handleSelectTrain}
        onToggleBackend={(b) => (activeBackend = b)}
        onOpenProjectDocs={() => (isDocsDrawerOpen = true)}
      />
    {:else}
      {#if currentView === 'seat_selection' && selectedTrain}
        <SeatSelectionCheckoutView
          train={selectedTrain}
          travelDate={selectedTravelDate}
          passengerCount={selectedPassengerCount}
          initialClass={selectedClassPreference}
          onBack={() => (currentView = 'search')}
          onConfirmBooking={handleConfirmBooking}
          currencySymbol={destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase())?.currencySymbol || '€'}
          currency={destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase())?.currency || 'EUR'}
        />
      {:else}
        {#if currentView === 'confirmation' && activeBooking}
          <TicketConfirmationView
            booking={activeBooking}
            onBackToSearch={() => (currentView = 'search')}
            onGoToMyBookings={() => (currentView = 'my_bookings')}
          />
        {:else}
          {#if currentView === 'my_bookings'}
            <MyBookingsView
              {bookings}
              onCancelBooking={handleCancelBooking}
              onViewTicket={handleViewTicket}
              onGoToSearch={() => (currentView = 'search')}
            />
          {/if}
        {/if}
      {/if}
    {/if}
  </main>

  <!-- ACADEMIC SPECIFICATIONS DRAWER MODAL -->
  {#if isDocsDrawerOpen}
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div class="bg-white w-full max-w-4xl min-h-screen shadow-2xl flex flex-col">
        <div class="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800 sticky top-0 z-20">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-600 rounded-xl text-white">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-black text-white">
                Ficha Técnica del Proyecto Final · Programación 3
              </h3>
              <p class="text-xs text-slate-400">
                Seguimiento de 12 Issues, Conventional Commits y Arquitectura Docker
              </p>
            </div>
          </div>

          <button
            onclick={() => (isDocsDrawerOpen = false)}
            class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <ProjectManagementView
            {issues}
            onUpdateIssueStatus={handleUpdateIssueStatus}
          />
        </div>
      </div>
    </div>
  {/if}
</div>
