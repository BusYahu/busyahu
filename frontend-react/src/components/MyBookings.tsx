import React, { useState } from 'react';
import { Booking } from '../types';
import { Ticket, QrCode, Trash2, CheckCircle2, AlertCircle, Search } from 'lucide-react';

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
    if (bookingToCancel) {
      onCancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Modal de Cancelación */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                ¿Deseas cancelar esta reserva?
              </h3>
              <p className="text-xs text-slate-500">
                Se liberarán inmediatamente los asientos de la reserva{' '}
                <strong className="font-mono text-slate-800">{bookingToCancel.bookingCode}</strong>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Título */}
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
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Aún no tienes billetes reservados</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Dirígete al buscador y selecciona un trayecto para emitir tu primer billete con código QR.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToSearch}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" /> Buscar Trenes Disponibles
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isCancelled = b.status === 'cancelled';
            return (
              <div
                key={b.id}
                className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-5 ${
                  isCancelled ? 'border-slate-200 bg-slate-50/70 opacity-75' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400">
                      PNR: {b.bookingCode}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {b.train.operator} ({b.train.trainNumber})
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

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <div className="text-lg font-black text-slate-900">{b.train.fromCity}</div>
                      <div className="text-xs font-bold text-indigo-700">{b.train.departureTime}</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">➔ {b.train.duration} ➔</div>
                    <div>
                      <div className="text-lg font-black text-slate-900">{b.train.toCity}</div>
                      <div className="text-xs font-bold text-indigo-700">{b.train.arrivalTime}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Fecha: <strong>{b.travelDate}</strong> • Asientos:{' '}
                    <strong className="text-indigo-700 font-mono">
                      {b.passengers.map(p => p.seatId).join(', ')}
                    </strong>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 gap-3">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                    <div className="text-xl font-black text-slate-900">
                      {b.currency} {b.totalPrice}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCancelled && (
                      <>
                        <button
                          type="button"
                          onClick={() => onViewTicket(b)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" /> Ver E-Ticket
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingToCancel(b)}
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
          })}
        </div>
      )}
    </div>
  );
}