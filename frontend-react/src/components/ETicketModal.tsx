import React, { useState } from 'react';
import { Booking } from '../types';
import { CheckCircle2, QrCode, Train, Clock, Printer, Copy, Check } from 'lucide-react';

interface ETicketModalProps {
  booking: Booking;
  onClose: () => void;
}

export function ETicketModal({ booking, onClose }: ETicketModalProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl space-y-6">
      
      {/* Cabecera Éxito */}
      <div className="bg-emerald-50 border-b border-emerald-200 p-6 text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">¡Boleto Emitido con Éxito!</h2>
        <p className="text-xs text-slate-600">
          Localizador PNR:{' '}
          <button 
            type="button"
            onClick={copyCode} 
            className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1 cursor-pointer"
          >
            {booking.bookingCode} {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </p>
      </div>

      {/* Tarjeta Simil Boarding Pass */}
      <div className="px-6 sm:px-8 space-y-6">
        <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 font-bold text-white">
              <Train className="w-4 h-4 text-indigo-400" /> {booking.train.operator} ({booking.train.trainModel})
            </div>
            <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
              VALIDADO
            </span>
          </div>

          <div className="grid grid-cols-3 items-center text-center my-3">
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-mono">ORIGEN</div>
              <div className="text-xl sm:text-2xl font-black">{booking.train.fromCity}</div>
              <div className="text-xs text-indigo-400 font-bold">{booking.train.departureTime}</div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-slate-400">{booking.train.duration}</span>
              <div className="w-20 h-0.5 bg-slate-700 my-1 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Tren #{booking.train.trainNumber}</span>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">DESTINO</div>
              <div className="text-xl sm:text-2xl font-black">{booking.train.toCity}</div>
              <div className="text-xs text-indigo-400 font-bold">{booking.train.arrivalTime}</div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">FECHA</span>
              <span className="font-bold">{booking.travelDate}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">ASIENTOS</span>
              <span className="font-bold text-amber-400">
                {booking.passengers.map(p => p.seatId).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Sección QR */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-white p-2 border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <QrCode className="w-20 h-20 text-slate-900" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Pase de Abordo Digital</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Escanea este código en los torniquetes de acceso al andén.
              </p>
              <div className="text-[10px] text-indigo-600 font-mono font-bold mt-1">
                HASH: {booking.bookingCode}-BUSYAHU-PROG3-VERIFIED
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 w-full sm:w-auto">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Abonado</div>
            <div className="text-xl font-black text-slate-900">
              {booking.currency} {booking.totalPrice}
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimir Billete
        </button>
      </div>

    </div>
  );
}