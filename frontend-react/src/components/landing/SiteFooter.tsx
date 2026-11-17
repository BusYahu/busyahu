import React from 'react';
import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Linkedin,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Train,
  Youtube,
} from 'lucide-react';

interface SiteFooterProps {
  onGoHome: () => void;
  onGoBookings: () => void;
  onGoFaq: () => void;
  onGoDestinations: () => void;
  onOpenAdmin: () => void;
}

const PAYMENTS = [
  { label: 'VISA', className: 'text-[#1a1f71]' },
  { label: 'Mastercard', className: 'text-[#eb001b]' },
  { label: 'AMEX', className: 'text-[#006fcf]' },
  { label: 'PayPal', className: 'text-[#003087]' },
  { label: 'Apple Pay', className: 'text-slate-900' },
  { label: 'G Pay', className: 'text-[#4285f4]' },
  { label: 'Bizum', className: 'text-[#00a9e0]' },
];

export function SiteFooter({
  onGoHome,
  onGoBookings,
  onGoFaq,
  onGoDestinations,
  onOpenAdmin,
}: SiteFooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <button type="button" onClick={onGoHome} className="flex items-center gap-2.5 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Train className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight text-white">BusYahu Rail</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
                Viaja más lejos
              </span>
            </span>
          </button>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-400">
            Billetes de tren para 11 países, con operadores oficiales, asientos seleccionables y
            atención al viajero antes, durante y después de tu viaje.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900 bg-emerald-950/60 px-2.5 py-1 text-emerald-300">
              <ShieldCheck className="h-3 w-3" /> Pago seguro
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300">
              <Mail className="h-3 w-3" /> Billete QR inmediato
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2">
            {[Instagram, Facebook, Youtube, Linkedin].map((Icon, index) => (
              <button
                key={index}
                type="button"
                aria-label="Red social de BusYahu"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:border-emerald-700 hover:text-emerald-300"
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Explora</h3>
          <ul className="mt-4 space-y-2.5 text-xs font-semibold">
            <li>
              <button type="button" onClick={onGoDestinations} className="transition-colors hover:text-white">
                Destinos por país
              </button>
            </li>
            <li>
              <button type="button" onClick={onGoBookings} className="transition-colors hover:text-white">
                Mis billetes
              </button>
            </li>
            <li>
              <button type="button" onClick={onGoFaq} className="transition-colors hover:text-white">
                Centro de ayuda
              </button>
            </li>
            <li>
              <button type="button" onClick={onGoHome} className="transition-colors hover:text-white">
                Buscar trenes
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Compañía</h3>
          <ul className="mt-4 space-y-2.5 text-xs font-semibold">
            <li><span className="cursor-default">Sobre BusYahu</span></li>
            <li><span className="cursor-default">Sostenibilidad</span></li>
            <li><span className="cursor-default">Prensa y alianzas</span></li>
            <li><span className="cursor-default">Trabaja con nosotros</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Legal</h3>
          <ul className="mt-4 space-y-2.5 text-xs font-semibold">
            <li><span className="cursor-default">Términos y condiciones</span></li>
            <li><span className="cursor-default">Política de privacidad</span></li>
            <li><span className="cursor-default">Política de cookies</span></li>
            <li><span className="cursor-default">Accesibilidad</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Métodos de pago
            </span>
            {PAYMENTS.map((payment) => (
              <span
                key={payment.label}
                className={`rounded-md bg-white px-2 py-1 text-[9px] font-black tracking-tight shadow-sm ${payment.className}`}
              >
                {payment.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-500">
            <span>© 2026 BusYahu Rail</span>
            <span className="hidden h-3 w-px bg-slate-800 sm:block" />
            <span>Precios con impuestos incluidos</span>
            <span className="hidden h-3 w-px bg-slate-800 sm:block" />
            <span>Español · EUR</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Operado por BusYahu Rail · Billetes emitidos por operadores ferroviarios asociados.</span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 self-start rounded-md px-1.5 py-1 font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-slate-300 sm:self-auto"
            title="Acceso restringido para administradores de la red"
          >
            <LockKeyhole className="h-3 w-3" />
            Panel de Control Ferroviario
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}
