import React from 'react';
import { CreditCard, QrCode, Search, TicketCheck } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Elige tu ruta',
    description: 'Selecciona origen, destino, fecha y número de viajeros. Comparamos los trenes disponibles al instante.',
  },
  {
    icon: CreditCard,
    title: 'Reserva tu asiento',
    description: 'Escoge clase y asiento con un mapa del vagón claro. El precio final se muestra antes de confirmar.',
  },
  {
    icon: QrCode,
    title: 'Sube a bordo',
    description: 'Recibe tu billete digital con QR, guárdalo en tu teléfono y valida el acceso en el andén.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">
              <TicketCheck className="h-3.5 w-3.5" />
              Así de simple
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              De la búsqueda al andén en tres pasos.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
              Sin colas, sin letra pequeña y sin sorpresas en el precio. Tu billete queda guardado
              en “Mis Billetes” y se sincroniza entre los dos frontends del proyecto.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Cancelación flexible</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Asientos reales</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Soporte 24/7</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="absolute right-4 top-4 text-3xl font-black text-slate-100">
                    0{index + 1}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-black text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
