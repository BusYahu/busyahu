import { useCallback, useEffect, useState } from 'react';
import { INITIAL_TRAIN_ROUTES } from '../mockData';
import type { Booking, TrainRoute } from '../types';
import { apiGateway, type BackendId } from '../lib/apiClient';
import { readCachedBookings, readSession, saveCachedBookings } from '../lib/storage';

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

interface BookingManagerOptions {
  selectedTrain: TrainRoute | null;
  travelDate: string;
  activeBackend: BackendId;
}

export function useBookingManager({ selectedTrain, travelDate, activeBackend }: BookingManagerOptions) {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const cached = readCachedBookings();
    return cached.length ? cached : DEFAULT_BOOKINGS;
  });
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    saveCachedBookings(bookings);
  }, [bookings]);

  const confirmSeats = useCallback(
    (seats: string[], seatClass: 'tourist' | 'first' | 'business', price: number) => {
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
        .catch(() => {
          // Reserva conservada localmente.
        });
    },
    [selectedTrain, travelDate, activeBackend],
  );

  const cancelBooking = useCallback((id: string) => {
    setBookings((prev) =>
      prev.map((booking) => (booking.id === id ? { ...booking, status: 'cancelled' } : booking)),
    );
    void apiGateway.cancelBooking(id).catch(() => {
      // Cancelación aplicada localmente.
    });
  }, []);

  const viewTicket = useCallback((booking: Booking) => {
    setActiveBooking(booking);
    setIsTicketModalOpen(true);
  }, []);

  const confirmedBookingsCount = bookings.filter((booking) => booking.status === 'confirmed').length;

  return {
    bookings,
    activeBooking,
    isTicketModalOpen,
    confirmedBookingsCount,
    confirmSeats,
    cancelBooking,
    viewTicket,
    closeTicketModal: () => setIsTicketModalOpen(false),
  };
}
