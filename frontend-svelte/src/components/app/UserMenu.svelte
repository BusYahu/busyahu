<script lang="ts">
  import { Mail, ShieldCheck, Ticket, LogOut } from 'lucide-svelte';
  import type { User } from '../../types';

  type AppView = 'search' | 'seat_selection' | 'confirmation' | 'my_bookings';

  interface Props {
    currentUser: User;
    onNavigate: (view: AppView) => void;
    onLogout: () => void;
  }

  let { currentUser, onNavigate, onLogout }: Props = $props();

  let isUserMenuOpen = $state(false);

  function goToBookings() {
    onNavigate('my_bookings');
    isUserMenuOpen = false;
  }

  function logout() {
    isUserMenuOpen = false;
    onLogout();
  }
</script>

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
    <div class="absolute right-0 mt-2 w-56 glass-card text-slate-900 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
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
        onclick={goToBookings}
        class="w-full p-2 text-left hover:bg-slate-100 rounded-xl font-semibold flex items-center gap-2 text-slate-700"
      >
        <Ticket class="w-4 h-4 text-indigo-600" />
        <span>Mis Billetes Registrados</span>
      </button>

      <button
        onclick={logout}
        class="w-full p-2 text-left hover:bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center gap-2"
      >
        <LogOut class="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  {/if}
</div>
