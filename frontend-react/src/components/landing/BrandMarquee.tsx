import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { RAILWAY_BRANDS, type RailwayBrand } from '../../data/landing';

const BRAND_MARKS: Record<string, { short: string; main: string; secondary?: string }> = {
  renfe: { short: 'AVE', main: 'Renfe', secondary: 'AVE' },
  ouigo: { short: 'OU', main: 'ouigo', secondary: 'España' },
  iryo: { short: 'ir', main: 'iryo', secondary: 'Alta velocidad' },
  sncf: { short: 'SN', main: 'SNCF', secondary: 'TGV inOui' },
  db: { short: 'DB', main: 'Deutsche Bahn', secondary: 'ICE' },
  eurostar: { short: '★', main: 'EUROSTAR', secondary: 'High speed' },
  amtrak: { short: 'A', main: 'Amtrak', secondary: 'Acela' },
  via: { short: 'VIA', main: 'VIA Rail', secondary: 'Canada' },
  jr: { short: 'JR', main: 'JR Shinkansen', secondary: 'Japan' },
  crh: { short: 'CRH', main: 'China Railway', secondary: 'Fuxing' },
  ir: { short: 'IR', main: 'Indian Railways', secondary: 'Vande Bharat' },
  rzd: { short: 'РЖД', main: 'RZD', secondary: 'Sapsan' },
};

function BrandMark({ brand }: { brand: RailwayBrand }) {
  const mark = BRAND_MARKS[brand.id] ?? { short: brand.id.slice(0, 2).toUpperCase(), main: brand.name };
  const lightBox = brand.id === 'via';

  return (
    <div className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.55)]">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-black tracking-tight"
        style={{
          backgroundColor: brand.color,
          color: lightBox ? '#082f49' : '#ffffff',
        }}
        aria-hidden="true"
      >
        {mark.short}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black leading-tight" style={{ color: brand.color }}>
          {mark.main}
        </span>
        <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {mark.secondary ?? brand.region}
        </span>
      </span>
      <BadgeCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
    </div>
  );
}

function BrandRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-3 pr-3"
      aria-hidden={ariaHidden || undefined}
    >
      {RAILWAY_BRANDS.map((brand) => (
        <BrandMark key={`${ariaHidden ? 'clone' : 'main'}-${brand.id}`} brand={brand} />
      ))}
    </div>
  );
}

export function BrandMarquee() {
  return (
    <section className="border-y border-slate-200 bg-slate-50/80 py-8" aria-label="Operadores ferroviarios internacionales">
      <div className="mx-auto mb-5 flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
            Red global de operadores
          </div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900 sm:text-xl">
            Viaja con las marcas ferroviarias que ya conoces
          </h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">
          12 operadores verificados
        </span>
      </div>

      <div className="marquee-mask relative overflow-hidden">
        <div className="marquee-track flex w-max">
          <BrandRow />
          <BrandRow ariaHidden />
        </div>
      </div>
    </section>
  );
}
