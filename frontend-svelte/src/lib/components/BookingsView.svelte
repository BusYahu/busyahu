<script>
  import { bookings, auth, nav, modal } from '../stores.js';
  import { Ticket, Loader2, Eye, XCircle, Clock, Train } from 'lucide-svelte';

  $: if ($auth.user) {
    bookings.loadMyBookings();
  }

  async function handleCancel(bookingId) {
    if (!confirm('¿Estás seguro de que querés cancelar esta reserva?')) return;

    try {
      await bookings.cancelBooking(bookingId);
    } catch (err) {
      alert('Error al cancelar: ' + err.message);
    }
  }

  function viewTicket(booking) {
    nav.navigate('ticket', { booking });
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return dateStr;
  }

  function getStatusBadge(status) {
    return status === 'confirmed'
      ? 'bg-emerald-500/20 text-emerald-400'
      : 'bg-red-500/20 text-red-400';
  }

  function getStatusText(status) {
    return status === 'confirmed' ? 'Confirmada' : 'Cancelada';
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <div class="flex items-center gap-3 mb-6">
    <Ticket class="w-6 h-6 text-emerald-400" />
    <h2 class="text-2xl font-bold text-white">Mis Reservas</h2>
  </div>

  {#if !$auth.user}
    <div class="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
      <Ticket class="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p class="text-slate-400 mb-4">Iniciá sesión para ver tus reservas</p>
      <button
        class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        on:click={() => modal.openAuth()}
      >
        Iniciar Sesión
      </button>
    </div>
  {:else if $bookings.loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 text-emerald-400 animate-spin" />
      <span class="ml-3 text-slate-400">Cargando reservas...</span>
    </div>
  {:else if $bookings.error}
    <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <p class="text-red-400">{$bookings.error}</p>
    </div>
  {:else if $bookings.bookings.length === 0}
    <div class="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
      <Ticket class="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <p class="text-slate-400 mb-4">No tenés reservas aún</p>
      <button
        class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        on:click={() => nav.navigate('search')}
      >
        Buscar Trenes
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each $bookings.bookings as booking}
        <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-slate-700">
            <div class="flex items-center gap-3">
              <Train class="w-5 h-5 text-emerald-400" />
              <div>
                <p class="font-bold text-white">{booking.train?.name || 'Tren'}</p>
                <p class="text-sm text-slate-400">{booking.train?.code || ''}</p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium {getStatusBadge(booking.status)}">
              {getStatusText(booking.status)}
            </span>
          </div>

          <!-- Body -->
          <div class="p-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p class="text-xs text-slate-400">Código</p>
                <p class="font-medium text-white">{booking.bookingCode}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">Fecha</p>
                <p class="font-medium text-white">{formatDate(booking.travelDate || booking.date)}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">Asientos</p>
                <p class="font-medium text-white">{booking.seats?.join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">Total</p>
                <p class="font-medium text-emerald-400">{booking.currency} {booking.totalPrice?.toFixed(2)}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                on:click={() => viewTicket(booking)}
              >
                <Eye class="w-4 h-4" />
                Ver Boleto
              </button>
              {#if booking.status === 'confirmed'}
                <button
                  class="py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  on:click={() => handleCancel(booking.id)}
                >
                  <XCircle class="w-4 h-4" />
                  Cancelar
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
