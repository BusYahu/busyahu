import { useCallback } from 'react';
import type { TrainRoute, User } from '../../types';
import type { ApiMeta, HealthMap } from '../../lib/apiClient';
import type { AppView } from '../../lib/appView';
import { useTravelCatalog } from '../../hooks/useTravelCatalog';
import { useBookingManager } from '../../hooks/useBookingManager';
import { scrollToSection } from '../../lib/scroll';
import { LandingView } from './LandingView';
import { BookingsPage } from './BookingsPage';
import { SeatSelectionPage } from './SeatSelectionPage';
import { AdminView } from './AdminView';

interface AppRoutesProps {
  currentView: AppView;
  catalog: ReturnType<typeof useTravelCatalog>;
  booking: ReturnType<typeof useBookingManager>;
  currentUser: User;
  selectedTrain: TrainRoute | null;
  activeBackend: 'express' | 'fastapi';
  health: HealthMap;
  lastResult: ApiMeta;
  onGoHome: () => void;
  onSelectTrain: (train: TrainRoute) => void;
  onConfirmSeats: (seats: string[], seatClass: 'tourist' | 'first' | 'business', price: number) => void;
  onSwitchUserRole: (role: 'client' | 'admin') => void;
  onSwitchBackend: (backend: 'express' | 'fastapi') => void;
  onRetryAlternate: () => void;
  onRefresh: () => void;
}

export function AppRoutes({
  currentView,
  catalog,
  booking,
  currentUser,
  selectedTrain,
  activeBackend,
  health,
  lastResult,
  onGoHome,
  onSelectTrain,
  onConfirmSeats,
  onSwitchUserRole,
  onSwitchBackend,
  onRetryAlternate,
  onRefresh,
}: AppRoutesProps) {
  const selectCountry = useCallback(
    (countryId: string) => {
      catalog.setSelectedCountryId(countryId);
      onGoHome();
    },
    [catalog.setSelectedCountryId, onGoHome],
  );

  const exploreCountry = useCallback(
    (countryId: string) => {
      catalog.setSelectedCountryId(countryId);
      onGoHome();
      scrollToSection('resultados', 120);
    },
    [catalog.setSelectedCountryId, onGoHome],
  );

  const searchResults = useCallback(() => {
    onGoHome();
    scrollToSection('resultados', 80);
  }, [onGoHome]);

  return (
    <>
      {currentView === 'search' && (
        <LandingView
          destinations={catalog.destinations}
          selectedCountryId={catalog.selectedCountryId}
          fromCity={catalog.fromCity}
          toCity={catalog.toCity}
          travelDate={catalog.travelDate}
          passengerCount={catalog.passengerCount}
          currentDestination={catalog.currentDestination}
          currentCountryTrains={catalog.currentCountryTrains}
          loadingCatalog={catalog.loadingCatalog}
          onSelectCountry={selectCountry}
          onFromCityChange={catalog.setFromCity}
          onToCityChange={catalog.setToCity}
          onTravelDateChange={catalog.setTravelDate}
          onPassengerCountChange={catalog.setPassengerCount}
          onSwapCities={() => {
            catalog.setFromCity(catalog.toCity);
            catalog.setToCity(catalog.fromCity);
          }}
          onSearch={searchResults}
          onExploreCountry={exploreCountry}
          onSelectTrain={onSelectTrain}
          onReload={() => void catalog.loadCatalog()}
          onGoHome={onGoHome}
        />
      )}

      {currentView === 'my_bookings' && (
        <BookingsPage
          bookings={booking.bookings}
          onCancelBooking={booking.cancelBooking}
          onViewTicket={booking.viewTicket}
          onGoHome={onGoHome}
        />
      )}

      {currentView === 'seat_selection' && selectedTrain && (
        <SeatSelectionPage
          train={selectedTrain}
          date={catalog.travelDate}
          currencySymbol={catalog.currentDestination?.currencySymbol || '€'}
          onBack={searchResults}
          onConfirmSeats={onConfirmSeats}
        />
      )}

      {currentView === 'admin' && (
        <AdminView
          currentUser={currentUser}
          onSwitchUserRole={onSwitchUserRole}
          trains={catalog.trains}
          destinations={catalog.destinations}
          onAddTrain={catalog.addTrain}
          onUpdateTrain={catalog.updateTrain}
          onDeleteTrain={catalog.deleteTrain}
          activeBackend={activeBackend}
          onToggleBackend={onSwitchBackend}
          health={health}
          lastResult={lastResult}
          loading={catalog.loadingCatalog}
          onRefresh={onRefresh}
          onRetryAlternate={onRetryAlternate}
          onGoHome={onGoHome}
        />
      )}
    </>
  );
}
