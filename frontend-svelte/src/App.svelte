<script lang="ts">
  import { INITIAL_ISSUES } from './data';
  import type { Booking, Passenger, ProjectIssue, TrainRoute } from './types';
  import AppMain from './components/app/AppMain.svelte';
  import AppTopBar from './components/app/AppTopBar.svelte';
  import AppOverlays from './components/app/AppOverlays.svelte';
  import AppFooter from './components/app/AppFooter.svelte';
  import { createAppRuntime } from './lib/appRuntime.svelte.js';
  import { createBookingSession } from './lib/bookingSession.svelte.js';
  import { createSessionUser } from './lib/sessionUser.svelte.js';

  type AppView = 'search' | 'seat_selection' | 'confirmation' | 'my_bookings';
  type ClassTier = 'tourist' | 'first' | 'business';

  const runtime = createAppRuntime();
  const sessionUser = createSessionUser();

  let currentView = $state<AppView>('search');
  let isDocsDrawerOpen = $state(false);
  let isAuthModalOpen = $state(false);
  let isCreateRouteOpen = $state(false);
  let issues = $state<ProjectIssue[]>(INITIAL_ISSUES);
  let selectedTrain = $state<TrainRoute | null>(null);
  let selectedTravelDate = $state<string>('2026-09-15');
  let selectedPassengerCount = $state<number>(1);
  let selectedClassPreference = $state<ClassTier>('tourist');

  const selectedDestination = $derived(
    runtime.destinations.find(
      (destination) => destination.country.toLowerCase() === selectedTrain?.country.toLowerCase(),
    ),
  );

  const bookingSession = createBookingSession({
    selectedTrain: () => selectedTrain,
    travelDate: () => selectedTravelDate,
    currentUser: () => sessionUser.currentUser,
    currency: () => selectedDestination?.currency ?? 'EUR',
    backend: () => runtime.activeBackend,
  });

  $effect(() => runtime.start());

  function goTo(view: AppView) {
    currentView = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectTrain(train: TrainRoute, date: string, count: number, classTier: ClassTier = 'tourist') {
    selectedTrain = train;
    selectedTravelDate = date;
    selectedPassengerCount = count;
    selectedClassPreference = classTier;
    goTo('seat_selection');
  }

  function handleConfirmBooking(passengers: Passenger[], totalPrice: number, contactEmail?: string) {
    if (bookingSession.create(passengers, totalPrice, contactEmail)) {
      goTo('confirmation');
    }
  }

  function handleViewTicket(booking: Booking) {
    bookingSession.select(booking);
    goTo('confirmation');
  }

  function handleUpdateIssueStatus(issueId: string, newStatus: ProjectIssue['status']) {
    issues = issues.map((issue) => (issue.id === issueId ? { ...issue, status: newStatus } : issue));
  }
</script>

<div class="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
  <AppTopBar
    {currentView}
    currentUser={sessionUser.currentUser}
    bookingsCount={bookingSession.confirmedCount}
    activeBackend={runtime.activeBackend}
    health={runtime.health}
    lastResult={runtime.lastResult}
    loading={runtime.catalogLoading}
    onNavigate={goTo}
    onOpenAuth={() => (isAuthModalOpen = true)}
    onLogout={sessionUser.logout}
    onOpenDocs={() => (isDocsDrawerOpen = true)}
    onCreateRoute={() => (isCreateRouteOpen = true)}
    onSwitchBackend={runtime.switchBackend}
    onRefresh={runtime.refreshAll}
    onRetryAlternate={runtime.retryAlternate}
  />

  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
    <AppMain
      {currentView}
      destinations={runtime.destinations}
      trains={runtime.trains}
      activeBackend={runtime.activeBackend}
      currentUser={sessionUser.currentUser}
      {selectedTrain}
      {selectedTravelDate}
      {selectedPassengerCount}
      selectedClassPreference={selectedClassPreference}
      currencySymbol={selectedDestination?.currencySymbol || '€'}
      currency={selectedDestination?.currency || 'EUR'}
      bookings={bookingSession.bookings}
      activeBooking={bookingSession.activeBooking}
      onSelectTrain={handleSelectTrain}
      onSwitchBackend={runtime.switchBackend}
      onOpenDocs={() => (isDocsDrawerOpen = true)}
      onOpenAuth={() => (isAuthModalOpen = true)}
      onBackToSearch={() => goTo('search')}
      onConfirmBooking={handleConfirmBooking}
      onGoToMyBookings={() => goTo('my_bookings')}
      onCancelBooking={bookingSession.cancel}
      onViewTicket={handleViewTicket}
    />
  </main>

  <AppOverlays
    {isAuthModalOpen}
    {isCreateRouteOpen}
    {isDocsDrawerOpen}
    {issues}
    onCloseAuth={() => (isAuthModalOpen = false)}
    onLoginSuccess={(user) => {
      sessionUser.setUser(user);
      isAuthModalOpen = false;
    }}
    onCloseCreateRoute={() => (isCreateRouteOpen = false)}
    onRouteCreated={() => {
      isCreateRouteOpen = false;
      void runtime.loadCatalog();
    }}
    onUpdateIssueStatus={handleUpdateIssueStatus}
  />

  <AppFooter onOpenDocs={() => (isDocsDrawerOpen = true)} />
</div>
