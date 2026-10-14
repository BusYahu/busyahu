import React, { useState } from 'react';
import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from './mockData';
import type { TrainRoute, Booking, Destination, User } from './types';

// Componentes reales de tu proyecto
import { Navbar } from './components/Navbar';
import { CountrySelector } from './components/CountrySelector';
import { SeatMap } from './components/SeatMap';
import { ETicketModal } from './components/ETicketModal';
import { MyBookings } from './components/MyBookings';
import { AdminRouteManagementView } from './components/AdminRouteManagementView';

import { ArrowRight, Train as TrainIcon, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'search' | 'seat_selection' | 'my_bookings' | 'admin'>('search');
  
  // Usuario RBAC para la Issue #09
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'USR-ADMIN-01',
    email: 'admin.ferroviario@etec.um.edu.ar',
    name: 'Administrador E.T.E.C.',
    role: 'admin',
  });

  const [destinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [trains, setTrains] = useState<TrainRoute[]>(INITIAL_TRAIN_ROUTES);
  
  // ID del país seleccionado (por defecto 'es' para España)
  const [selectedCountryId, setSelectedCountryId] = useState<string>(
    INITIAL_DESTINATIONS[0]?.id || 'es'
  );

  const [selectedTrain, setSelectedTrain] = useState<TrainRoute | null>(null);
  const [selectedTravelDate] = useState<string>('2026-09-20');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [activeBackend, setActiveBackend] = useState<'express' | 'fastapi'>('express');

  const [bookings, setBookings] = useState<Booking[]>([
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
  ]);

  // CRUD Admin (Issue #09)
  const handleAddTrain = (newTrain: TrainRoute) => {
    setTrains((prev) => [newTrain, ...prev]);
  };

  const handleUpdateTrain = (updatedTrain: TrainRoute) => {
    setTrains((prev) => prev.map((t) => (t.id === updatedTrain.id ? updatedTrain : t)));
  };

  const handleDeleteTrain = (trainId: string) => {
    setTrains((prev) => prev.filter((t) => t.id !== trainId));
  };

  const handleSwitchUserRole = (newRole: 'client' | 'admin') => {
    setCurrentUser((prev) => ({
      ...prev,
      role: newRole,
      email: newRole === 'admin' ? 'admin.ferroviario@etec.um.edu.ar' : 'cliente.turista@etec.um.edu.ar',
    }));
  };

  // Manejo de confirmación de asientos según la interfaz de SeatMap
  const handleConfirmSeats = (
    seats: string[], 
    seatClass: 'tourist' | 'first' | 'business', 
    price: number
  ) => {
    if (!selectedTrain) return;

    const newBooking: Booking = {
      id: `BK-${Date.now()}`,
      bookingCode: `RW-${selectedTrain.country.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      train: selectedTrain,
      travelDate: selectedTravelDate,
      passengers: seats.map((s) => ({
        fullName: 'Lucas Gómez',
        passportId: 'PAS-123456',
        seatId: s,
        seatClass,
        price,
      })),
      totalPrice: price,
      currency: selectedTrain.currency,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'confirmed',
      qrPayload: `RAILWORLD-VERIFIED:${selectedTrain.trainNumber}:LUCAS_GOMEZ`,
      userEmail: 'ls.gomez@alumno.etec.um.edu.ar',
    };

    setBookings([newBooking, ...bookings]);
    setActiveBooking(newBooking);
    setIsTicketModalOpen(true);
    setCurrentView('search');
  };

  // Obtener datos del país seleccionado
  const currentDestination = destinations.find((d) => d.id === selectedCountryId) || destinations[0];
  const currentCountryTrains = trains.filter(
    (t) => t.country.toLowerCase() === currentDestination?.country.toLowerCase()
  );

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
              Mis Billetes ({bookings.filter((b) => b.status === 'confirmed').length})
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
            onToggleBackend={setActiveBackend}
          />
        )}

        {/* Vista Mis Billetes */}
        {currentView === 'my_bookings' && (
          <MyBookings
            bookings={bookings}
            onCancelBooking={(id) =>
              setBookings((prev) =>
                prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
              )
            }
            onViewTicket={(b) => {
              setActiveBooking(b);
              setIsTicketModalOpen(true);
            }}
            onGoToSearch={() => setCurrentView('search')}
          />
        )}

        {/* Vista Selección de Asientos */}
        {currentView === 'seat_selection' && selectedTrain && (
          <SeatMap
            train={selectedTrain}
            date={selectedTravelDate}
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

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Trenes Disponibles en {currentDestination?.country} ({currentCountryTrains.length})
              </h2>

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