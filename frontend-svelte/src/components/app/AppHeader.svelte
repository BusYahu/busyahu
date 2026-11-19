<script lang="ts">
  import { Train, Layers, User as UserIcon } from 'lucide-svelte';
  import type { User } from '../../types';
  import HeaderNav from './HeaderNav.svelte';
  import UserMenu from './UserMenu.svelte';

  type AppView = 'search' | 'seat_selection' | 'confirmation' | 'my_bookings';

  interface Props {
    currentView: AppView;
    currentUser: User | null;
    bookingsCount: number;
    onNavigate: (view: AppView) => void;
    onOpenAuth: () => void;
    onLogout: () => void;
    onOpenDocs: () => void;
    onCreateRoute: () => void;
  }

  let {
    currentView,
    currentUser,
    bookingsCount,
    onNavigate,
    onOpenAuth,
    onLogout,
    onOpenDocs,
    onCreateRoute,
  }: Props = $props();

  let selectedCurrency = $state<'EUR' | 'USD' | 'GBP'>('EUR');

  const isAuthorizedRouteCreator = $derived(
    currentUser?.email?.toLowerCase() === 'v.dilello@alumno.etec.um.edu.ar',
  );
</script>

<header class="glass-dark text-white sticky top-0 z-40 border-b border-white/10 shadow-lg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
    <button onclick={() => onNavigate('search')} class="flex items-center gap-2.5 text-left group">
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

    <HeaderNav {currentView} {currentUser} {bookingsCount} {onNavigate} {onOpenAuth} />

    <div class="flex items-center gap-2 sm:gap-3">
      <select
        bind:value={selectedCurrency}
        class="hidden sm:block bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="EUR">€ EUR</option>
        <option value="USD">$ USD</option>
        <option value="GBP">£ GBP</option>
      </select>

      {#if currentUser}
        <UserMenu {currentUser} {onNavigate} {onLogout} />
      {:else}
        <button
          onclick={onOpenAuth}
          class="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 border border-indigo-400/40 ring-2 ring-indigo-500/20 active:scale-95"
        >
          <UserIcon class="w-3.5 h-3.5 text-amber-300" />
          <span>Iniciar Sesión / Registro</span>
        </button>
      {/if}

      <button
        onclick={onOpenDocs}
        class="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
        title="Ver Ficha Técnica Universitaria (12 Issues, Docker y Commit Conventions)"
      >
        <Layers class="w-3.5 h-3.5 text-indigo-400" />
        <span class="hidden sm:inline">Ficha Técnica</span>
      </button>

      {#if isAuthorizedRouteCreator}
        <button
          onclick={onCreateRoute}
          class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg border border-emerald-500 transition-colors flex items-center gap-1.5"
          title="Crear nueva ruta/tren (solo usuario autorizado)"
        >
          <span>➕ Crear Ruta</span>
        </button>
      {/if}
    </div>
  </div>
</header>
