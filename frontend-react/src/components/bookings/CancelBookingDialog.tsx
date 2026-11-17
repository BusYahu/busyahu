import { AlertCircle } from 'lucide-react';
import type { Booking } from '../../types';

interface CancelBookingDialogProps {
  booking: Booking;
  onDismiss: () => void;
  onConfirm: () => void;
}

export function CancelBookingDialog({ booking, onDismiss, onConfirm }: CancelBookingDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">¿Deseas cancelar esta reserva?</h3>
          <p className="text-xs text-slate-500">
            Se liberarán inmediatamente los asientos de la reserva{' '}
            <strong className="font-mono text-slate-800">{booking.bookingCode}</strong>.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
          >
            Sí, Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
