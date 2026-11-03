import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from './mockData';
import type { TrainRoute, Booking, Destination, User } from './types';

// Componentes reales de tu proyecto
import { Navbar } from './components/Navbar';
import { CountrySelector } from './components/CountrySelector';
import { SeatMap } from './components/SeatMap';
import { ETicketModal } from './components/ETicketModal';
import { MyBookings } from './components/MyBookings';
import { AdminRouteManagementView } from './components/AdminRouteManagementView';
import { ConnectivityHub } from './components/ConnectivityHub';

import { ArrowRight, Train as TrainIcon, ShieldCheck, ArrowLeftRight, RefreshCw } from 'lucide-react';
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
  id: 'USR-ADMIN-01',
  email: 'admin.ferroviario@etec.um.edu.ar',
  name: 'Administrador E.T.E.C.',
  role: 'admin',
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

export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'seat_selection' | 'my_bookings' | 'admin'>('search');
  const initialFilters = useMemo(() => readSearchFilters(), []);

  // Usuario RBAC para la Issue #09. Si hay una sesión compartida por Svelte,
  // se reutiliza tal cual (misma clave localStorage).
  const [currentUser, setCurrentUser] = useState<User>(() => readSession().user ?? DEFAULT_USER);

  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [trains, setTrains] = useState<TrainRoute[]>(INITIAL_TRAIN_ROUTES);

  // Filtros de búsqueda (se conservan al conmutar de backend o de frontend).
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
      // El cliente ya cae a mock; este catch evita romper la interfaz.
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

  // CRUD Admin (Issue #09)
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

  // Manejo de confirmación de asientos: se muestra el billete de inmediato y
  // se sincroniza con el backend activo (con fallback ordenado a mock).
  const handleConfirmSeats = (
    seats: string[],
    seatClass: 'tourist' | 'first' | 'business',
    price: number,
  ) => {
    if (!selectedTrain) return;

    const session = readSession();
    const userEmail = session.user?.email || 'ls.gomez@alumno.etec.um.edu.ar';
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Navbar Superior */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => setCurrentView('search')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <TrainIcon className="w-5 h-5" />
            </div>
            <span className="text-lg font-black text-white">BusYahu</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('search')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                currentView === 'search' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Buscador
            </button>
            <button
              onClick={() => setCurrentView('my_bookings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                currentView === 'my_bookings' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Mis Billetes ({bookings.filter((booking) => booking.status === 'confirmed').length})
            </button>

            {/* Botón Admin Protegido (Issue #09) */}
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                currentView === 'admin'
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:bg-rose-950/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Admin Rutas</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-rose-500/20 text-rose-300">
                {currentUser.role}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Panel de conectividad e interoperabilidad (Issue #11) */}
      <ConnectivityHub
        activeBackend={activeBackend}
        health={health}
        lastResult={lastResult}
        loading={loadingCatalog}
        onSwitchBackend={handleSwitchBackend}
        onRefresh={handleRefreshAll}
        onRetryAlternate={handleRetryAlternate}
      />

      {/* Cuerpo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Vista Admin (Issue #09) */}
        {currentView === 'admin' && (
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
        )}

        {/* Vista Mis Billetes */}
        {currentView === 'my_bookings' && (
          <MyBookings
            bookings={bookings}
            onCancelBooking={handleCancelBooking}
            onViewTicket={(booking) => {
              setActiveBooking(booking);
              setIsTicketModalOpen(true);
            }}
            onGoToSearch={() => setCurrentView('search')}
          />
        )}

        {/* Vista Selección de Asientos */}
        {currentView === 'seat_selection' && selectedTrain && (
          <SeatMap
            train={selectedTrain}
            date={travelDate}
            currencySymbol={currentDestination?.currencySymbol || '€'}
            onBack={() => setCurrentView('search')}
            onConfirmSeats={handleConfirmSeats}
          />
        )}

        {/* Vista Buscador */}
        {currentView === 'search' && (
          <div className="space-y-6">
            <CountrySelector
              destinations={destinations}
              selectedCountryId={selectedCountryId}
              onSelectCountry={setSelectedCountryId}
            />

            {/* Filtros de búsqueda persistentes entre React, Svelte y backends */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Origen
                  </label>
                  <select
                    value={fromCity}
                    onChange={(event) => setFromCity(event.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  >
                    {currentDestinationCities.map((city) => (
                      <option key={`from-${city.name}`} value={city.name}>
                        {city.name} ({city.station})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const previousFrom = fromCity;
                      setFromCity(toCity);
                      setToCity(previousFrom);
                    }}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-slate-600"
                    title="Intercambiar origen y destino"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Destino
                  </label>
                  <select
                    value={toCity}
                    onChange={(event) => setToCity(event.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  >
                    {currentDestinationCities.map((city) => (
                      <option key={`to-${city.name}`} value={city.name}>
                        {city.name} ({city.station})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={travelDate}
                    onChange={(event) => setTravelDate(event.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                    Viajeros
                  </label>
                  <select
                    value={passengerCount}
                    onChange={(event) => setPassengerCount(Number(event.target.value))}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 text-center"
                  >
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Trenes Disponibles en {currentDestination?.country} ({currentCountryTrains.length})
                </h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono">
                    {apiGateway.getBackendConfig(activeBackend).shortLabel} :{apiGateway.getBackendConfig(activeBackend).port}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-mono uppercase">
                    {lastResult.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => void loadCatalog()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-600"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingCatalog ? 'animate-spin' : ''}`} />
                    Recargar
                  </button>
                </div>
              </div>

              {currentCountryTrains.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">
                  No hay trenes para {fromCity} → {toCity}. Cambia el origen/destino o restablece los filtros.
                  <button
                    type="button"
                    onClick={() => {
                      setFromCity(currentDestinationCities[0]?.name || '');
                      setToCity(currentDestinationCities[1]?.name || '');
                    }}
                    className="ml-2 font-bold text-indigo-600 hover:underline"
                  >
                    Restablecer
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentCountryTrains.map((train) => (
                    <div key={train.id} className="border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{train.trainNumber} - {train.operator}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <span>{train.fromCity}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{train.toCity}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-700 mt-1">
                          {train.departureTime} - {train.arrivalTime} ({train.duration})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">
                          {currentDestination?.currencySymbol || '€'} {train.basePrice}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTrain(train);
                            setCurrentView('seat_selection');
                          }}
                          className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all"
                        >
                          Elegir Asiento
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal E-Ticket */}
        {isTicketModalOpen && activeBooking && (
          <ETicketModal
            booking={activeBooking}
            onClose={() => setIsTicketModalOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
