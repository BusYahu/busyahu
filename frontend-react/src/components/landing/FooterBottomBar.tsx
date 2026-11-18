import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { PAYMENTS } from './footerData';

interface FooterBottomBarProps {
  onOpenAdmin: () => void;
}

/** Franja inferior con métodos de pago, legales y acceso admin. */
export function FooterBottomBar({ onOpenAdmin }: FooterBottomBarProps) {
  return (
    <>
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
    </>
  );
}
