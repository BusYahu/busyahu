<script lang="ts">
  import { Search, Compass, Ticket, User as UserIcon } from 'lucide-svelte';
  import type { User } from '../../types';

  type AppView = 'search' | 'seat_selection' | 'confirmation' | 'my_bookings';

  interface Props {
    currentView: AppView;
    currentUser: User | null;
    bookingsCount: number;
    onNavigate: (view: AppView) => void;
    onOpenAuth: () => void;
  }

  let { currentView, currentUser, bookingsCount, onNavigate, onOpenAuth }: Props = $props();

  const isSearchActive = $derived(currentView === 'search' || currentView === 'seat_selection');
  const isBookingsActive = $derived(
    currentView === 'my_bookings' || currentView === 'confirmation',
  );

  function exploreDestinations() {
    onNavigate('search');
    setTimeout(() => {
      document.getElementById('train-results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function openAccount() {
    if (currentUser) {
      onNavigate('my_bookings');
    } else {
      onOpenAuth();
    }
  }
</script>

<nav class="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-bold">
  <button
    onclick={() => onNavigate('search')}
    class="px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 {isSearchActive ? 'bg-indigo-600/90 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}"
  >
    <Search class="w-4 h-4" />
    <span>Comprar Billetes</span>
  </button>

  <button
    onclick={exploreDestinations}
    class="px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
  >
    <Compass class="w-4 h-4" />
    <span>Explorar Destinos</span>
  </button>

  <button
    onclick={() => onNavigate('my_bookings')}
    class="px-3 py-2 rounded-xl transition-colors flex items-center gap-2 {isBookingsActive ? 'bg-indigo-600/90 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}"
  >
    <Ticket class="w-4 h-4" />
    <span>Mis Billetes</span>
    {#if bookingsCount > 0}
      <span class="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full tabular-nums">
        {bookingsCount}
      </span>
    {/if}
  </button>

  <button
    onclick={openAccount}
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
