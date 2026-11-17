import { useCallback } from 'react';
import { useBackendHealth } from './lib/useBackendHealth';
import { useTravelCatalog } from './hooks/useTravelCatalog';
import { useBookingManager } from './hooks/useBookingManager';
import { useSessionUser } from './hooks/useSessionUser';
import { useAppNavigation } from './hooks/useAppNavigation';
import { SiteHeader } from './components/landing/SiteHeader';
import { SiteFooter } from './components/landing/SiteFooter';
import { AppRoutes } from './components/app/AppRoutes';
import { TicketModalOverlay } from './components/app/TicketModalOverlay';

export type { AppView } from './lib/appView';

export default function App() {
  const catalog = useTravelCatalog();
  const { currentUser, switchRole } = useSessionUser();
  const { health, lastResult, refresh: refreshHealth } = useBackendHealth();
  const nav = useAppNavigation(catalog.loadCatalog, refreshHealth);

  const booking = useBookingManager({
    selectedTrain: nav.selectedTrain,
    travelDate: catalog.travelDate,
    activeBackend: nav.activeBackend,
  });

  const confirmSeats = useCallback(
    (seats: string[], seatClass: 'tourist' | 'first' | 'business', price: number) => {
      booking.confirmSeats(seats, seatClass, price);
      nav.goTo('search');
    },
    [booking.confirmSeats, nav.goTo],
  );

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900">
      <SiteHeader
        destinations={catalog.destinations}
        selectedCountryId={catalog.selectedCountryId}
        currentView={nav.currentView}
        currentUser={currentUser}
        bookingsCount={booking.confirmedBookingsCount}
        onSelectCountry={(countryId) => {
          catalog.setSelectedCountryId(countryId);
          nav.goTo('search');
        }}
        onGoHome={nav.goHome}
        onGoBookings={() => nav.goTo('my_bookings')}
        onGoDestinations={() => nav.goToSection('destinos')}
        onGoFaq={() => nav.goToSection('ayuda')}
      />

      <main className="flex-1">
        <AppRoutes
          currentView={nav.currentView}
          catalog={catalog}
          booking={booking}
          currentUser={currentUser}
          selectedTrain={nav.selectedTrain}
          activeBackend={nav.activeBackend}
          health={health}
          lastResult={lastResult}
          onGoHome={nav.goHome}
          onSelectTrain={nav.selectTrain}
          onConfirmSeats={confirmSeats}
          onSwitchUserRole={switchRole}
          onSwitchBackend={nav.switchBackend}
          onRetryAlternate={nav.retryAlternate}
          onRefresh={() => void nav.refreshAll()}
        />
      </main>

      <SiteFooter
        onGoHome={nav.goHome}
        onGoBookings={() => nav.goTo('my_bookings')}
        onGoFaq={() => nav.goToSection('ayuda')}
        onGoDestinations={() => nav.goToSection('destinos')}
        onOpenAdmin={() => nav.goTo('admin')}
      />

      {booking.isTicketModalOpen && booking.activeBooking && (
        <TicketModalOverlay
          booking={booking.activeBooking}
          onClose={booking.closeTicketModal}
        />
      )}
    </div>
  );
}
