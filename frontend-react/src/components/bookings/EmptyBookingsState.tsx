import { Search, Ticket } from 'lucide-react';

export function EmptyBookingsState({ onGoToSearch }: { onGoToSearch: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
        <Ticket className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-base font-extrabold text-slate-900">
          Aún no tienes billetes reservados
        </h3>
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
  );
}
