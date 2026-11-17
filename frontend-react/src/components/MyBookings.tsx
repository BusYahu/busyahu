import { useState } from 'react';
import type { Booking } from '../types';
import { BookingCard } from './bookings/BookingCard';
import { CancelBookingDialog } from './bookings/CancelBookingDialog';
import { EmptyBookingsState } from './bookings/EmptyBookingsState';

interface MyBookingsProps {
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
  onViewTicket: (booking: Booking) => void;
  onGoToSearch: () => void;
}

export function MyBookings({
  bookings,
  onCancelBooking,
  onViewTicket,
  onGoToSearch,
}: MyBookingsProps) {
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  const confirmCancel = () => {
    if (!bookingToCancel) return;
    onCancelBooking(bookingToCancel.id);
    setBookingToCancel(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {bookingToCancel && (
        <CancelBookingDialog
          booking={bookingToCancel}
          onDismiss={() => setBookingToCancel(null)}
          onConfirm={confirmCancel}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Mis Billetes Emitidos
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Accede a tus códigos QR de embarque o gestiona la cancelación de tus viajes.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {bookings.length} {bookings.length === 1 ? 'Reserva' : 'Reservas'}
        </span>
      </div>

      {bookings.length === 0 ? (
        <EmptyBookingsState onGoToSearch={onGoToSearch} />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewTicket={() => onViewTicket(booking)}
              onRequestCancel={() => setBookingToCancel(booking)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
