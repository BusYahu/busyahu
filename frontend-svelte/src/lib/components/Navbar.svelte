<script>
  import { auth, nav, modal } from '../stores.js';
  import { Train, User, LogOut, Ticket, MapPin } from 'lucide-svelte';

  function handleLogout() {
    auth.logout();
    nav.navigate('search');
  }
</script>

<nav class="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <button
        class="flex items-center gap-2 text-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
        on:click={() => nav.navigate('search')}
      >
        <Train class="w-6 h-6" />
        <span>BusYahu</span>
      </button>

      <!-- Navigation Links -->
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
            {$nav.currentView === 'search' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          on:click={() => nav.navigate('search')}
        >
          <MapPin class="w-4 h-4" />
          Buscar
        </button>

        {#if $auth.user}
          <button
            class="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
              {$nav.currentView === 'bookings' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
            on:click={() => nav.navigate('bookings')}
          >
            <Ticket class="w-4 h-4" />
            Mis Reservas
          </button>
        {/if}

        <!-- Auth Button -->
        {#if $auth.user}
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-300">
              <User class="w-4 h-4 inline mr-1" />
              {$auth.user.name}
            </span>
            <button
              class="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              on:click={handleLogout}
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        {:else}
          <button
            class="flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            on:click={() => modal.openAuth()}
          >
            <User class="w-4 h-4" />
            Iniciar Sesión
          </button>
        {/if}
      </div>
    </div>
  </div>
</nav>
