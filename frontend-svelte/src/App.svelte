<script>
  import { onMount } from 'svelte';
  import { auth, nav, destinations, modal } from './lib/stores.js';
  import Navbar from './lib/components/Navbar.svelte';
  import AuthModal from './lib/components/AuthModal.svelte';
  import SearchView from './lib/components/SearchView.svelte';
  import SeatMap from './lib/components/SeatMap.svelte';
  import BookingsView from './lib/components/BookingsView.svelte';
  import PaymentView from './lib/components/PaymentView.svelte';
  import TicketView from './lib/components/TicketView.svelte';

  // Check auth on mount
  onMount(() => {
    auth.checkAuth();
    destinations.load();
  });

  $: currentView = $nav.currentView;
  $: params = $nav.params;
</script>

<div class="min-h-screen bg-slate-900">
  <!-- Navbar -->
  <Navbar />

  <!-- Auth Modal -->
  <AuthModal />

  <!-- Main Content -->
  <main>
    {#if currentView === 'search'}
      <SearchView />
    {:else if currentView === 'seats'}
      <SeatMap train={params?.train} date={params?.date} />
    {:else if currentView === 'bookings'}
      <BookingsView />
    {:else if currentView === 'payment'}
      <PaymentView
        train={params?.train}
        date={params?.date}
        seats={params?.seats || []}
        totalPrice={params?.totalPrice || 0}
      />
    {:else if currentView === 'ticket'}
      <TicketView booking={params?.booking} />
    {:else}
      <SearchView />
    {/if}
  </main>

  <!-- Footer -->
  <footer class="bg-slate-800 border-t border-slate-700 mt-auto">
    <div class="max-w-7xl mx-auto px-4 py-6 text-center text-slate-400 text-sm">
      <p>© 2026 BusYahu - Plataforma de Reservas Ferroviarias</p>
      <p class="mt-1">Trabajo Final Integrador - Programación 3</p>
    </div>
  </footer>
</div>
