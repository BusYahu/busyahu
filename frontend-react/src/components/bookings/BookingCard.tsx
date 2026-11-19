import { CheckCircle2, QrCode, Trash2 } from 'lucide-react';
import type { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  onViewTicket: () => void;
  onRequestCancel: () => void;
}

export function BookingCard({ booking, onViewTicket, onRequestCancel }: BookingCardProps) {
  const isCancelled = booking.status === 'cancelled';

  return (
    <div
      className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-5 ${
        isCancelled
          ? 'border-slate-200 bg-slate-50/70 opacity-75'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="space-y-3">
        <BookingHeader booking={booking} isCancelled={isCancelled} />
        <JourneySummary booking={booking} />
        <div className="text-xs text-slate-500">
          Fecha: <strong>{booking.travelDate}</strong> • Asientos:{' '}
          <strong className="text-indigo-700 font-mono">
            {booking.passengers.map((passenger) => passenger.seatId).join(', ')}
          </strong>
        </div>
      </div>

      <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 gap-3">
        <div className="text-left md:text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
          <div className="text-xl font-black text-slate-900">
            {booking.currency} {booking.totalPrice}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCancelled && (
            <>
              <button
                type="button"
                onClick={onViewTicket}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" /> Ver E-Ticket
              </button>
              <button
                type="button"
                onClick={onRequestCancel}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingHeader({ booking, isCancelled }: { booking: Booking; isCancelled: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400">
        PNR: {booking.bookingCode}
      </span>
      <span className="text-xs text-slate-500 font-medium">
        {booking.train.operator} ({booking.train.trainNumber})
      </span>
      {isCancelled ? (
        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded-md">
          Cancelado • Asientos Liberados
        </span>
      ) : (
        <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmado
        </span>
      )}
    </div>
  );
}

function JourneySummary({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div>
        <div className="text-lg font-black text-slate-900">{booking.train.fromCity}</div>
        <div className="text-xs font-bold text-indigo-700">{booking.train.departureTime}</div>
      </div>
      <div className="text-xs text-slate-400 font-mono">➔ {booking.train.duration} ➔</div>
      <div>
        <div className="text-lg font-black text-slate-900">{booking.train.toCity}</div>
        <div className="text-xs font-bold text-indigo-700">{booking.train.arrivalTime}</div>
      </div>
    </div>
  );
}
