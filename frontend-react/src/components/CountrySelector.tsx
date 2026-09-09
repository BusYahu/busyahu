import { Destination } from '../types';

interface CountrySelectorProps {
  destinations: Destination[];
  selectedCountryId: string;
  onSelectCountry: (id: string) => void;
}

export function CountrySelector({
  destinations,
  selectedCountryId,
  onSelectCountry,
}: CountrySelectorProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Paso 1: Selecciona una Red Ferroviaria (11 Países Oficiales)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Haz clic en cualquier bandera para cargar sus estaciones y trenes de alta velocidad.
          </p>
        </div>
        <span className="text-[11px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 self-start sm:self-auto">
          {destinations.length} redes disponibles
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {destinations.map((dest) => {
          const isSelected = dest.id === selectedCountryId;
          return (
            <button
              type="button"
              key={dest.id}
              onClick={() => onSelectCountry(dest.id)}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-500/20 scale-[1.02]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:scale-[1.01]'
              }`}
            >
              <span className="text-2xl sm:text-3xl drop-shadow-xs">{dest.flagEmoji}</span>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                  {dest.country}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <span>{dest.currencySymbol}</span>
                  <span>•</span>
                  <span className="truncate">{dest.cities.length} ciudades</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}