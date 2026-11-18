import { Globe2, ShieldCheck, Sparkles, Star } from 'lucide-react';

/** Bloque editorial superior del hero. */
export function HeroCopy() {
  return (
    <div className="max-w-3xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200 backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5" />
        11 países · 33 destinos de postal
      </span>

      <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
        Tu próximo viaje empieza
        <span className="block text-emerald-300">sobre las vías correctas.</span>
      </h1>

      <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-slate-200 sm:text-base">
        Compara trenes de alta velocidad, elige tu asiento y recibe tu billete QR al instante.
        De Sevilla a Tokio, con tarifas claras y cancelación flexible.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-200 sm:text-xs">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-300" /> Billetes oficiales
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-amber-300 text-amber-300" /> 4,8/5 en 48.000 viajeros
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Globe2 className="h-4 w-4 text-emerald-300" /> Sin cargos ocultos
        </span>
      </div>
    </div>
  );
}
