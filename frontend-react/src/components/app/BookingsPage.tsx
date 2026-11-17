import { ArrowLeft } from 'lucide-react';
import type { Booking } from '../../types';
import { MyBookings } from '../MyBookings';

interface BookingsPageProps {
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
  onViewTicket: (booking: Booking) => void;
  onGoHome: () => void;
}

export function BookingsPage({
  bookings,
  onCancelBooking,
  onViewTicket,
  onGoHome,
}: BookingsPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BackToSearchButton onClick={onGoHome} label="Volver al buscador" />
      <MyBookings
        bookings={bookings}
        onCancelBooking={onCancelBooking}
        onViewTicket={onViewTicket}
        onGoToSearch={onGoHome}
      />
    </div>
  );
}

interface BackToSearchButtonProps {
  onClick: () => void;
  label: string;
}

export function BackToSearchButton({ onClick, label }: BackToSearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
