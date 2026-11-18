import { Facebook, Instagram, Linkedin, Mail, ShieldCheck, Train, Youtube } from 'lucide-react';

interface FooterBrandProps {
  onGoHome: () => void;
}

const SOCIAL_ICONS = [Instagram, Facebook, Youtube, Linkedin];

/** Columna de marca y redes sociales del pie de página. */
export function FooterBrand({ onGoHome }: FooterBrandProps) {
  return (
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
        {SOCIAL_ICONS.map((Icon, index) => (
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
  );
}
