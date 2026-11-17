import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Train as TrainIcon } from 'lucide-react';
import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from './mockData';
import type { TrainRoute, Booking, Destination, User } from './types';

import { SeatMap } from './components/SeatMap';
import { ETicketModal } from './components/ETicketModal';
import { MyBookings } from './components/MyBookings';
import { AdminRouteManagementView } from './components/AdminRouteManagementView';
import { ConnectivityHub } from './components/ConnectivityHub';
import { SiteHeader } from './components/landing/SiteHeader';
import { SiteFooter } from './components/landing/SiteFooter';
import { HeroCarousel } from './components/landing/HeroCarousel';
import { BrandMarquee } from './components/landing/BrandMarquee';
import { DestinationShowcase } from './components/landing/DestinationShowcase';
import { HowItWorks } from './components/landing/HowItWorks';
import { TrainResults } from './components/landing/TrainResults';
import { FAQAccordion } from './components/landing/FAQAccordion';

import { apiGateway, type BackendId } from './lib/apiClient';
import { useBackendHealth } from './lib/useBackendHealth';
import {
  readCachedBookings,
  readSearchFilters,
  readSession,
  saveCachedBookings,
  saveSearchFilters,
} from './lib/storage';

const DEFAULT_USER: User = {
  id: 'USR-CLIENT-01',
  email: 'cliente.turista@etec.um.edu.ar',
  name: 'Cliente BusYahu',
  role: 'client',
};

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'BK-1001',
    bookingCode: 'RW-ES-9841',
    train: INITIAL_TRAIN_ROUTES[0],
    travelDate: '2026-09-20',
    passengers: [
      {
        fullName: 'Lucas Gómez',
        passportId: 'PAS-459201',
        seatId: '1-A',
        seatClass: 'tourist',
        price: 65,
      },
    ],
    totalPrice: 65,
    currency: 'EUR',
    createdAt: '2026-08-14 09:30',
    status: 'confirmed',
    qrPayload: 'RAILWORLD:RW-ES-9841:MAD-BCN:LUCAS_GOMEZ',
    userEmail: 'ls.gomez@alumno.etec.um.edu.ar',
  },
];

function scrollToSection(sectionId: string, delay = 80) {
  window.setTimeout(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, delay);
}

export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'seat_selection' | 'my_bookings' | 'admin'>('search');
  const initialFilters = useMemo(() => readSearchFilters(), []);

  // La landing es B2C: el visitante entra como cliente. El panel administrativo
  // mantiene la protección RBAC y muestra 403 hasta elevar el rol.
  const [currentUser, setCurrentUser] = useState<User>(() => readSession().user ?? DEFAULT_USER);

  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [trains, setTrains] = useState<TrainRoute[]>(INITIAL_TRAIN_ROUTES);

  const [selectedCountryId, setSelectedCountryId] = useState<string>(
    initialFilters.countryId || INITIAL_DESTINATIONS[0]?.id || 'es',
  );
  const [fromCity, setFromCity] = useState<string>(initialFilters.fromCity || 'Madrid');
  const [toCity, setToCity] = useState<string>(initialFilters.toCity || 'Barcelona');
  const [travelDate, setTravelDate] = useState<string>(
    initialFilters.travelDate || new Date().toISOString().slice(0, 10),
  );
  const [passengerCount, setPassengerCount] = useState<number>(initialFilters.passengerCount || 1);
  const [selectedClass, setSelectedClass] = useState<'tourist' | 'first' | 'business'>(
    initialFilters.selectedClass || 'tourist',
  );

  const [selectedTrain, setSelectedTrain] = useState<TrainRoute | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeBackend, setActiveBackendState] = useState<BackendId>(() => apiGateway.getActiveBackend());
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const cached = readCachedBookings();
    return cached.length ? cached : DEFAULT_BOOKINGS;
  });

  const { health, lastResult, refresh: refreshHealth } = useBackendHealth();

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [nextDestinations, nextTrains] = await Promise.all([
        apiGateway.getDestinations(),
        apiGateway.getTrains(),
      ]);
      if (nextDestinations.length) setDestinations(nextDestinations);
      if (nextTrains.length) setTrains(nextTrains);
    } catch (error) {
      // El gateway ya cae a mock; este catch evita romper la interfaz.
      console.warn('[BusYahu] No se pudo refrescar el catálogo:', error);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
    const unsubscribeBackend = apiGateway.onBackendChanged((backend) => {
      setActiveBackendState(backend);
      void loadCatalog();
    });
    const unsubscribeSession = apiGateway.onSessionChanged((session) => {
      setCurrentUser(session.user ?? DEFAULT_USER);
    });
    return () => {
      unsubscribeBackend();
      unsubscribeSession();
    };
  }, [loadCatalog]);

  useEffect(() => {
    saveSearchFilters({
      countryId: selectedCountryId,
      fromCity,
      toCity,
      travelDate,
      passengerCount,
      selectedClass,
    });
  }, [selectedCountryId, fromCity, toCity, travelDate, passengerCount, selectedClass]);

  useEffect(() => {
    saveCachedBookings(bookings);
  }, [bookings]);

  const currentDestination =
    destinations.find((destination) => destination.id === selectedCountryId) || destinations[0];

  const currentDestinationCities = currentDestination?.cities ?? [];

  useEffect(() => {
    if (!currentDestinationCities.length) return;
    if (!currentDestinationCities.some((city) => city.name === fromCity)) {
      setFromCity(currentDestinationCities[0].name);
    }
    if (!currentDestinationCities.some((city) => city.name === toCity)) {
      setToCity(currentDestinationCities[1]?.name || currentDestinationCities[0].name);
    }
  }, [currentDestination?.id, currentDestinationCities, fromCity, toCity]);

  const currentCountryTrains = useMemo(() => {
    if (!currentDestination) return [];
    return trains.filter((train) => {
      const sameCountry = train.country.toLowerCase() === currentDestination.country.toLowerCase();
      const sameOrigin = fromCity ? train.fromCity.toLowerCase() === fromCity.toLowerCase() : true;
      const sameDestination = toCity ? train.toCity.toLowerCase() === toCity.toLowerCase() : true;
      return sameCountry && sameOrigin && sameDestination;
    });
  }, [trains, currentDestination, fromCity, toCity]);

  const handleSwitchBackend = useCallback((backend: BackendId) => {
    apiGateway.switchBackend(backend);
    setActiveBackendState(backend);
  }, []);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([refreshHealth(), loadCatalog()]);
  }, [loadCatalog, refreshHealth]);

  const handleRetryAlternate = useCallback(() => {
    handleSwitchBackend(activeBackend === 'express' ? 'fastapi' : 'express');
  }, [activeBackend, handleSwitchBackend]);

  const handleGoHome = useCallback(() => {
    setCurrentView('search');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40);
  }, []);

  const handleGoBookings = useCallback(() => {
    setCurrentView('my_bookings');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40);
  }, []);

  const handleGoDestinations = useCallback(() => {
    setCurrentView('search');
    scrollToSection('destinos');
  }, []);

  const handleGoFaq = useCallback(() => {
    setCurrentView('search');
    scrollToSection('ayuda');
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setCurrentView('admin');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 40);
  }, []);

  const handleSelectCountry = useCallback((countryId: string) => {
    setSelectedCountryId(countryId);
    setCurrentView('search');
  }, []);

  const handleExploreCountry = useCallback((countryId: string) => {
    setSelectedCountryId(countryId);
    setCurrentView('search');
    scrollToSection('resultados', 120);
  }, []);

  const handleSwapCities = useCallback(() => {
    setFromCity(toCity);
    setToCity(fromCity);
  }, [fromCity, toCity]);

  const handleSearch = useCallback(() => {
    setCurrentView('search');
    scrollToSection('resultados', 80);
  }, []);

  const handleSelectTrain = useCallback((train: TrainRoute) => {
    setSelectedTrain(train);
    setCurrentView('seat_selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddTrain = (newTrain: TrainRoute) => {
    setTrains((prev) => [newTrain, ...prev]);
  };

  const handleUpdateTrain = (updatedTrain: TrainRoute) => {
    setTrains((prev) => prev.map((train) => (train.id === updatedTrain.id ? updatedTrain : train)));
  };

  const handleDeleteTrain = (trainId: string) => {
    setTrains((prev) => prev.filter((train) => train.id !== trainId));
  };

  const handleSwitchUserRole = (newRole: 'client' | 'admin') => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
      email: newRole === 'admin' ? 'admin.ferroviario@etec.um.edu.ar' : 'cliente.turista@etec.um.edu.ar',
    }));
  };

  const handleConfirmSeats = (
    seats: string[],
    seatClass: 'tourist' | 'first' | 'business',
    price: number,
  ) => {
    if (!selectedTrain) return;

    const session = readSession();
    const userEmail = session.user?.email || 'cliente.turista@etec.um.edu.ar';
    const totalPrice = price * Math.max(seats.length, 1);

    const newBooking: Booking = {
      id: `BK-${Date.now()}`,
      bookingCode: `RW-${(selectedTrain.countryCode || selectedTrain.country).substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      train: selectedTrain,
      trainId: selectedTrain.id,
      travelDate,
      date: travelDate,
      seats,
      passengers: seats.map((seat) => ({
        fullName: session.user?.name || 'Lucas Gómez',
        passportId: 'PAS-123456',
        seatId: seat,
        seatClass,
        price,
      })),
      totalPrice,
      currency: selectedTrain.currency,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'confirmed',
      qrPayload: `RAILWORLD-VERIFIED:${selectedTrain.trainNumber}:LUCAS_GOMEZ`,
      userEmail,
      backend: activeBackend,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setActiveBooking(newBooking);
    setIsTicketModalOpen(true);
    setCurrentView('search');

    void apiGateway
      .createBooking({
        trainId: selectedTrain.id,
        train: selectedTrain,
        travelDate,
        passengers: newBooking.passengers,
        totalPrice,
        currency: selectedTrain.currency,
        userEmail,
      })
      .then((synchronized) => {
        const merged: Booking = {
          ...synchronized,
          train: synchronized.train?.fromCity ? synchronized.train : selectedTrain,
        };
        setBookings((prev) =>
          prev.map((booking) => (booking.id === newBooking.id ? merged : booking)),
        );
        setActiveBooking(merged);
      })
      .catch((error) => {
        console.warn('[BusYahu] Reserva conservada localmente:', error);
      });
  };

  const handleCancelBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((booking) => (booking.id === id ? { ...booking, status: 'cancelled' } : booking)),
    );
    void apiGateway.cancelBooking(id).catch((error) => {
      console.warn('[BusYahu] Cancelación local:', error);
    });
  };

  const confirmedBookingsCount = bookings.filter((booking) => booking.status === 'confirmed').length;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900">
      <SiteHeader
        destinations={destinations}
        selectedCountryId={selectedCountryId}
        currentView={currentView}
        currentUser={currentUser}
        bookingsCount={confirmedBookingsCount}
        onSelectCountry={handleSelectCountry}
        onGoHome={handleGoHome}
        onGoBookings={handleGoBookings}
        onGoDestinations={handleGoDestinations}
        onGoFaq={handleGoFaq}
      />

      <main className="flex-1">
        {currentView === 'search' && (
          <>
            <HeroCarousel
              destinations={destinations}
              selectedCountryId={selectedCountryId}
              fromCity={fromCity}
              toCity={toCity}
              travelDate={travelDate}
              passengerCount={passengerCount}
              onSelectCountry={handleSelectCountry}
              onFromCityChange={setFromCity}
              onToCityChange={setToCity}
              onTravelDateChange={setTravelDate}
              onPassengerCountChange={setPassengerCount}
              onSwapCities={handleSwapCities}
              onSearch={handleSearch}
            />
            <BrandMarquee />
            <DestinationShowcase destinations={destinations} onSelectCountry={handleExploreCountry} />
            <HowItWorks />
            <TrainResults
              destination={currentDestination}
              fromCity={fromCity}
              toCity={toCity}
              travelDate={travelDate}
              trains={currentCountryTrains}
              loading={loadingCatalog}
              onSelectTrain={handleSelectTrain}
              onReload={() => void loadCatalog()}
            />
            <FAQAccordion />

            <section className="bg-emerald-900 py-14 text-white sm:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[32px] border border-emerald-700 bg-emerald-800 px-6 py-10 shadow-2xl sm:px-10">
                  <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-2xl" />
                  <div className="absolute -bottom-20 right-28 h-56 w-56 rounded-full bg-amber-300/10 blur-2xl" />
                  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-950/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        Tu viaje, a un clic
                      </span>
                      <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                        ¿Listo para cambiar de paisaje sin cambiar de ritmo?
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/80">
                        Encuentra tu próximo tren, elige asiento y lleva tu billete QR en el móvil.
                        Sin filas y con asistencia real cuando la necesites.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoHome}
                      className="inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-emerald-900 shadow-xl transition-transform hover:-translate-y-0.5"
                    >
                      <TrainIcon className="h-4 w-4" />
                      Buscar mi tren
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="relative mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-emerald-100/80">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Billetes oficiales
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Cambios flexibles
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" /> Soporte 24/7
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {currentView === 'my_bookings' && (
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleGoHome}
              className="mb-6 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al buscador
            </button>
            <MyBookings
              bookings={bookings}
              onCancelBooking={handleCancelBooking}
              onViewTicket={(booking) => {
                setActiveBooking(booking);
                setIsTicketModalOpen(true);
              }}
              onGoToSearch={handleGoHome}
            />
          </div>
        )}

        {currentView === 'seat_selection' && selectedTrain && (
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SeatMap
              train={selectedTrain}
              date={travelDate}
              currencySymbol={currentDestination?.currencySymbol || '€'}
              onBack={() => {
                setCurrentView('search');
                scrollToSection('resultados', 80);
              }}
              onConfirmSeats={handleConfirmSeats}
            />
          </div>
        )}

        {currentView === 'admin' && (
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleGoHome}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a la web pública
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">
                Acceso restringido · RBAC
              </span>
            </div>

            <ConnectivityHub
              activeBackend={activeBackend}
              health={health}
              lastResult={lastResult}
              loading={loadingCatalog}
              onSwitchBackend={handleSwitchBackend}
              onRefresh={() => void handleRefreshAll()}
              onRetryAlternate={handleRetryAlternate}
            />

            <div className="mt-6">
              <AdminRouteManagementView
                currentUser={currentUser}
                onSwitchUserRole={handleSwitchUserRole}
                trains={trains}
                destinations={destinations}
                onAddTrain={handleAddTrain}
                onUpdateTrain={handleUpdateTrain}
                onDeleteTrain={handleDeleteTrain}
                activeBackend={activeBackend}
                onToggleBackend={handleSwitchBackend}
              />
            </div>
          </div>
        )}
      </main>

      <SiteFooter
        onGoHome={handleGoHome}
        onGoBookings={handleGoBookings}
        onGoFaq={handleGoFaq}
        onGoDestinations={handleGoDestinations}
        onOpenAdmin={handleOpenAdmin}
      />

      {isTicketModalOpen && activeBooking && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto max-w-2xl">
            <ETicketModal booking={activeBooking} onClose={() => setIsTicketModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
