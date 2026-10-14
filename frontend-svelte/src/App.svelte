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
    Destination,
    User
  } from './types';
  import TrainSearchView from './components/TrainSearchView.svelte';
  import SeatSelectionCheckoutView from './components/SeatSelectionCheckoutView.svelte';
  import TicketConfirmationView from './components/TicketConfirmationView.svelte';
  import MyBookingsView from './components/MyBookingsView.svelte';
  import ProjectManagementView from './components/ProjectManagementView.svelte';
  import AuthModal from './components/AuthModal.svelte';
  import { 
    Train, 
    Ticket, 
    Search, 
    Compass, 
    Layers, 
    User as UserIcon,
    LogOut,
    ShieldCheck,
    CreditCard,
    Mail
  } from 'lucide-svelte';

  // Navigation tab state - Default is SEARCH (Client Travel Portal)
  let currentView = $state<'search' | 'seat_selection' | 'confirmation' | 'my_bookings'>('search');

  // Academic / Project Documentation Drawer State
  let isDocsDrawerOpen = $state(false);

  // User Authentication State (Local, NO Firebase)
  let currentUser = $state<User | null>(null);
  let isAuthModalOpen = $state(false);
  let isUserMenuOpen = $state(false);

  // Read stored user on start
  $effect(() => {
    try {
      const stored = localStorage.getItem('busyahu_user');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch (e) {
      // Ignored
    }
  });

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

  function handleConfirmBooking(passengers: Passenger[], totalPrice: number, contactEmail?: string) {
    if (!selectedTrain) return;

    const dest = destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase());
    const currency = dest ? dest.currency : 'EUR';

    // Auto-fill registered user's email if logged in
    const targetEmail = currentUser?.email || contactEmail || 'viajero@busyahurail.com';

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
      userEmail: targetEmail,
      userId: currentUser?.id,
      userDni: currentUser?.dni || passengers[0]?.passportId,
    };

    bookings = [newBooking, ...bookings];
    activeBooking = newBooking;
    currentView = 'confirmation';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleLogout() {
    localStorage.removeItem('busyahu_user');
    currentUser = null;
    isUserMenuOpen = false;
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
  <!-- ============================================================== -->
  <!-- CONSUMER TOP NAVBAR: 3-Zone Clean Header                       -->
  <!-- ============================================================== -->
  <header class="bg-slate-950 text-white border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md bg-slate-950/95">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
      <!-- Zone 1: Single Brand Element -->
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

        <button
          onclick={() => {
            if (currentUser) {
              currentView = 'my_bookings';
            } else {
              isAuthModalOpen = true;
            }
          }}
          class="px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 {currentUser ? 'text-emerald-300 hover:bg-slate-800/60' : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/60'}"
        >
          <UserIcon class="w-4 h-4" />
          <span>{currentUser ? 'Mi Cuenta' : 'Acceso / Registro'}</span>
          {#if !currentUser}
            <span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded-md uppercase font-black">
              10 Min
            </span>
          {/if}
        </button>
      </nav>

      <!-- Zone 3: Actions, User Profile & Academic Trigger -->
      <div class="flex items-center gap-2 sm:gap-3">
        <select
          bind:value={selectedCurrency}
          class="hidden sm:block bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="EUR">€ EUR</option>
          <option value="USD">$ USD</option>
          <option value="GBP">£ GBP</option>
        </select>

        <!-- User Profile / Auth Button (Local System, NO Firebase) -->
        {#if currentUser}
          <div class="relative">
            <button
              onclick={() => (isUserMenuOpen = !isUserMenuOpen)}
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-indigo-500/50 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-colors shadow-sm"
            >
              <div class="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {currentUser.firstName ? currentUser.firstName[0].toUpperCase() : 'U'}
              </div>
              <span class="max-w-[110px] truncate">{currentUser.name}</span>
              <span class="hidden sm:inline text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800">
                DNI: {currentUser.dni}
              </span>
            </button>

            {#if isUserMenuOpen}
              <div class="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs space-y-1">
                <div class="p-2 border-b border-slate-100">
                  <div class="font-bold text-slate-900 text-sm truncate">{currentUser.name}</div>
                  <div class="text-slate-500 font-mono text-[11px] truncate flex items-center gap-1 mt-0.5">
                    <Mail class="w-3 h-3 text-indigo-500" /> {currentUser.email}
                  </div>
                  <div class="text-emerald-700 font-bold text-[10px] mt-1 flex items-center gap-1">
                    <ShieldCheck class="w-3.5 h-3.5" /> Correo Verificado
                  </div>
                </div>

                <button
                  onclick={() => {
                    currentView = 'my_bookings';
                    isUserMenuOpen = false;
                  }}
                  class="w-full p-2 text-left hover:bg-slate-100 rounded-xl font-semibold flex items-center gap-2 text-slate-700"
                >
                  <Ticket class="w-4 h-4 text-indigo-600" />
                  <span>Mis Billetes Registrados</span>
                </button>

                <button
                  onclick={handleLogout}
                  class="w-full p-2 text-left hover:bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center gap-2"
                >
                  <LogOut class="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <button
            onclick={() => (isAuthModalOpen = true)}
            class="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 border border-indigo-400/40 ring-2 ring-indigo-500/20 active:scale-95"
          >
            <UserIcon class="w-3.5 h-3.5 text-amber-300" />
            <span>Iniciar Sesión / Registro</span>
          </button>
        {/if}

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

  <!-- Account Top CTA Strip for Visitors -->
  {#if !currentUser}
    <div class="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-slate-200 border-b border-indigo-900/60 text-xs py-2 px-4 shadow-inner">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs">
            ★
          </span>
          <span>
            <strong class="text-white">Sistema de Usuarios:</strong> Regístrate con tu <strong>Nombre, Apellido, DNI, Correo y Contraseña</strong> (código de 6 dígitos que vence en 10 min) para asociar y consultar tus billetes.
          </span>
        </div>
        <button
          onclick={() => (isAuthModalOpen = true)}
          class="px-3.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shadow transition-colors flex items-center gap-1.5 shrink-0"
        >
          <UserIcon class="w-3.5 h-3.5" />
          <span>Crear Cuenta / Iniciar Sesión</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- ============================================================== -->
  <!-- MAIN BODY                                                      -->
  <!-- ============================================================== -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if currentView === 'search'}
      <TrainSearchView
        {destinations}
        {trains}
        {activeBackend}
        {currentUser}
        onSelectTrain={handleSelectTrain}
        onToggleBackend={(b) => (activeBackend = b)}
        onOpenProjectDocs={() => (isDocsDrawerOpen = true)}
        onOpenAuthModal={() => (isAuthModalOpen = true)}
      />
    {:else if currentView === 'seat_selection' && selectedTrain}
      <SeatSelectionCheckoutView
        train={selectedTrain}
        travelDate={selectedTravelDate}
        passengerCount={selectedPassengerCount}
        initialClass={selectedClassPreference}
        {currentUser}
        onBack={() => (currentView = 'search')}
        onConfirmBooking={handleConfirmBooking}
        currencySymbol={destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase())?.currencySymbol || '€'}
        currency={destinations.find((d) => d.country.toLowerCase() === selectedTrain?.country.toLowerCase())?.currency || 'EUR'}
      />
    {:else if currentView === 'confirmation' && activeBooking}
      <TicketConfirmationView
        booking={activeBooking}
        onBackToSearch={() => (currentView = 'search')}
        onGoToMyBookings={() => (currentView = 'my_bookings')}
      />
    {:else if currentView === 'my_bookings'}
      <MyBookingsView
        {bookings}
        {currentUser}
        onOpenAuthModal={() => (isAuthModalOpen = true)}
        onCancelBooking={handleCancelBooking}
        onViewTicket={handleViewTicket}
        onGoToSearch={() => (currentView = 'search')}
      />
    {/if}
  </main>

  <!-- Auth Modal (Login / Register / 10-Minute Verification Code) -->
  <AuthModal
    isOpen={isAuthModalOpen}
    onClose={() => (isAuthModalOpen = false)}
    onLoginSuccess={(user) => {
      currentUser = user;
      isAuthModalOpen = false;
    }}
  />

  <!-- Academic Drawer -->
  {#if isDocsDrawerOpen}
    <ProjectManagementView
      {issues}
      onUpdateIssueStatus={handleUpdateIssueStatus}
      onClose={() => (isDocsDrawerOpen = false)}
    />
  {/if}

  <!-- Footer -->
  <footer class="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Train class="w-4 h-4 text-indigo-500" />
        <span class="font-bold text-white">BusYahu Rail</span>
        <span>· Sistema Oficial de Billetes Ferroviarios de Alta Velocidad</span>
      </div>

      <div class="flex items-center gap-4">
        <button
          onclick={() => (isDocsDrawerOpen = true)}
          class="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Ficha Técnica del Proyecto (12 Issues)
        </button>
        <span>·</span>
        <span>© 2026 Programación 3</span>
      </div>
    </div>
  </footer>
</div>
