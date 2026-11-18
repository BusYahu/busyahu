import { SearchX } from 'lucide-react';

/** Estado vacío cuando no hay trenes para la combinación elegida. */
export function EmptyTrainResults() {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-black text-slate-900">No hay trenes para esta combinación</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
        Prueba con otra ciudad de origen o destino, o cambia el país en el buscador superior.
      </p>
    </div>
  );
}
