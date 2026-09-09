import React, { useState } from 'react';
import { Destination, TrainRoute, Booking, Passenger } from './types';
import { Navbar } from './components/Navbar';
import { CountrySelector } from './components/CountrySelector';
import { SeatMap } from './components/SeatMap';
import { ETicketModal } from './components/ETicketModal';
import { MyBookings } from './components/MyBookings';
import { Search, MapPin, Calendar, Clock, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from './mockData';

const INITIAL_TRAINS: TrainRoute[] = [
  {
    id: 'TR-ES-1', trainNumber: 'AVE 03102', operator: 'Renfe', country: 'España',
    fromCity: 'Madrid', fromStation: 'Madrid Puerta de Atocha',
    toCity: 'Barcelona', toStation: 'Barcelona Sants',
    departureTime: '08:30', arrivalTime: '11:00', duration: '2h 30m',
    basePrice: 65, availableSeatsCount: 42, amenities: ['Wi-Fi 5G', 'Cafetería', 'Toma Corriente'],
    trainModel: 'AVE Serie 103 (310 km/h)'
  },
  {
    id: 'TR-ES-2', trainNumber: 'AVE 03144', operator: 'Renfe', country: 'España',
    fromCity: 'Madrid', fromStation: 'Madrid Puerta de Atocha',
    toCity: 'Barcelona', toStation: 'Barcelona Sants',
    departureTime: '14:00', arrivalTime: '16:45', duration: '2h 45m',
    basePrice: 72, availableSeatsCount: 28, amenities: ['Wi-Fi 5G', 'Silencio', 'Enchufe Individual'],
    trainModel: 'AVE Serie 102 Talgo'
  },
  {
    id: 'TR-FR-1', trainNumber: 'TGV 9204', operator: 'SNCF', country: 'Francia',
    fromCity: 'París', fromStation: 'Paris Gare de Lyon',
    toCity: 'Lyon', toStation: 'Lyon Part-Dieu',
    departureTime: '09:15', arrivalTime: '11:15', duration: '2h 00m',
    basePrice: 58, availableSeatsCount: 60, amenities: ['Bar TGV', 'Wi-Fi Gratuito'],
    trainModel: 'TGV Duplex 2N2'
  },
  {
    id: 'TR-JP-1', trainNumber: 'Nozomi 21', operator: 'JR Central', country: 'Japón',
    fromCity: 'Tokio', fromStation: 'Tokyo Station',
    toCity: 'Kioto', toStation: 'Kyoto Station',
    departureTime: '10:00', arrivalTime: '12:15', duration: '2h 15m',
    basePrice: 13500, availableSeatsCount: 84, amenities: ['Shinkansen Wi-Fi', 'Fumadores', 'Catering'],
    trainModel: 'Shinkansen Series N700S'
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<'search' | 'bookings'>('search');
  const [activeBackend, setActiveBackend] = useState<'express' | 'fastapi'>('express');

  const [selectedCountryId, setSelectedCountryId] = useState<string>('es');
  const currentDestination = INITIAL_DESTINATIONS.find(d => d.id === selectedCountryId) || INITIAL_DESTINATIONS[0];

  const [fromCity, setFromCity] = useState<string>(currentDestination.cities[0]?.name || 'Madrid');
  const [toCity, setToCity] = useState<string>(currentDestination.cities[1]?.name || 'Barcelona');
  const [travelDate, setTravelDate] = useState<string>('2026-10-15');

  const [activeTrain, setActiveTrain] = useState<TrainRoute | null>(null);
  const [isSelectingSeats, setIsSelectingSeats] = useState(false);
  const [activeETicket, setActiveETicket] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
    const dest = INITIAL_DESTINATIONS.find(d => d.id === countryId) || INITIAL_DESTINATIONS[0];
    setFromCity(dest.cities[0]?.name || '');
    setToCity(dest.cities[1]?.name || dest.cities[0]?.name || '');
  };

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const filteredTrains = INITIAL_TRAINS.filter(
    t => t.country.toLowerCase() === currentDestination.country.toLowerCase() &&
         (!fromCity || t.fromCity.toLowerCase() === fromCity.toLowerCase()) &&
         (!toCity || t.toCity.toLowerCase() === toCity.toLowerCase())
  );

  const handleConfirmSeats = (seats: string[], seatClass: 'tourist' | 'first' | 'business', price: number) => {
    const passengers: Passenger[] = seats.map((s, idx) => ({
      fullName: `Pasajero ${idx + 1}`,
      passportId: `PAS-94820${idx}`,
      seatId: s,
      seatClass,
      price,
    }));

    const newBooking: Booking = {
      id: `BK-${Date.now()}`,
      bookingCode: `BY-${Math.floor(100000 + Math.random() * 900000)}`,
      train: activeTrain!,
      travelDate,
      passengers,
      totalPrice: price * seats.length,
      currency: currentDestination.currencySymbol,
      status: 'confirmed',
      createdAt: new Date().toLocaleDateString('es-ES'),
    };

    setBookings([newBooking, ...bookings]);
    setIsSelectingSeats(false);
    setActiveETicket(newBooking);
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsSelectingSeats(false);
        }}
        activeBackend={activeBackend}
        onToggleBackend={setActiveBackend}
        bookingsCount={bookings.filter(b => b.status === 'confirmed').length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Modal de E-Ticket emitido */}
        {activeETicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <ETicketModal
              booking={activeETicket}
              onClose={() => setActiveETicket(null)}
            />
          </div>
        )}

        {currentTab === 'search' && (
          <>
            {isSelectingSeats && activeTrain ? (
              <SeatMap
                train={activeTrain}
                date={travelDate}
                currencySymbol={currentDestination.currencySymbol}
                onBack={() => setIsSelectingSeats(false)}
                onConfirmSeats={handleConfirmSeats}
              />
            ) : (
              <>
                {/* 1. Selector de los 11 Países */}
                <CountrySelector
                  destinations={INITIAL_DESTINATIONS}
                  selectedCountryId={selectedCountryId}
                  onSelectCountry={handleCountryChange}
                />

                {/* 2. Buscador de Trayectos */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Paso 2: Define tu Trayecto y Fecha
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                    <div className="lg:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Origen
                      </label>
                      <select
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold"
                      >
                        {currentDestination.cities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.station})</option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden lg:flex lg:col-span-1 justify-center pb-1">
                      <button
                        type="button"
                        onClick={handleSwapCities}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="lg:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Destino
                      </label>
                      <select
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold"
                      >
                        {currentDestination.cities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name} ({c.station})</option>
                        ))}
                      </select>
                    </div>

                    <div className="lg:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" /> Fecha del Viaje
                      </label>
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Resultados de Trenes */}
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Trenes Disponibles en {currentDestination.country}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {filteredTrains.length} servicios
                    </span>
                  </h3>

                  {filteredTrains.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
                      <div className="text-base font-bold text-slate-800">
                        No hay trenes programados para {fromCity} ➔ {toCity}
                      </div>
                      <p className="text-xs text-slate-500">
                        Prueba invirtiendo las ciudades o selecciona España, Francia o Japón.
                      </p>
                      <button
                        type="button"
                        onClick={handleSwapCities}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Invertir a {toCity} ➔ {fromCity}
                      </button>
                    </div>
                  ) : (
                    filteredTrains.map((train) => (
                      <div
                        key={train.id}
                        className="bg-white border border-slate-200 hover:border-indigo-500 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                      >
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-black">
                              {train.operator}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {train.trainNumber}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {train.trainModel}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 pt-1">
                            <div>
                              <div className="text-2xl font-extrabold text-slate-900">{train.departureTime}</div>
                              <div className="text-xs font-bold text-slate-700">{train.fromCity}</div>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {train.duration}
                              </span>
                              <div className="w-24 sm:w-36 h-1 bg-slate-200 rounded-full my-1"></div>
                              <span className="text-[10px] text-indigo-700 font-bold font-mono">Directo</span>
                            </div>
                            <div>
                              <div className="text-2xl font-extrabold text-slate-900">{train.arrivalTime}</div>
                              <div className="text-xs font-bold text-slate-700">{train.toCity}</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {train.amenities.map((item, i) => (
                              <span key={i} className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 gap-3">
                          <div className="text-left lg:text-right">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Desde</div>
                            <div className="text-2xl font-black text-slate-900">
                              {currentDestination.currencySymbol}{train.basePrice}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTrain(train);
                              setIsSelectingSeats(true);
                            }}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md flex items-center gap-2 cursor-pointer"
                          >
                            <span>Seleccionar Asientos</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}

        {currentTab === 'bookings' && (
          <MyBookings
            bookings={bookings}
            onCancelBooking={handleCancelBooking}
            onViewTicket={(b) => setActiveETicket(b)}
            onGoToSearch={() => setCurrentTab('search')}
          />
        )}

      </main>
    </div>
  );
}