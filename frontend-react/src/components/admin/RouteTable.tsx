import { ArrowRight, Edit3, Plus, Search, Train, Trash2 } from 'lucide-react';
import type { TrainRoute } from '../../types';

interface RouteTableProps {
  trains: TrainRoute[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onOpenCreate: () => void;
  onEdit: (train: TrainRoute) => void;
  onDelete: (trainId: string, trainNumber: string) => void;
}

export function RouteTable({
  trains,
  searchQuery,
  onSearchQueryChange,
  onOpenCreate,
  onEdit,
  onDelete,
}: RouteTableProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por código de tren, país, ciudad o empresa..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        <button
          onClick={onOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Crear Nueva Ruta de Tren
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-4">Identificador</th>
                <th className="p-4">País &amp; Operador</th>
                <th className="p-4">Trayecto</th>
                <th className="p-4">Horarios</th>
                <th className="p-4">Precio Base</th>
                <th className="p-4">Plazas</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trains.map((train) => (
                <RouteRow
                  key={train.id}
                  train={train}
                  onEdit={() => onEdit(train)}
                  onDelete={() => onDelete(train.id, train.trainNumber)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface RouteRowProps {
  train: TrainRoute;
  onEdit: () => void;
  onDelete: () => void;
}

function RouteRow({ train, onEdit, onDelete }: RouteRowProps) {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="p-4 font-mono font-bold text-slate-900">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Train className="w-4 h-4" />
          </span>
          <div>
            <div>{train.trainNumber}</div>
            <div className="text-[10px] text-slate-400 font-sans">{train.trainModel}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="font-semibold text-slate-900">{train.country}</div>
        <div className="text-[11px] text-slate-500">{train.operator}</div>
      </td>
      <td className="p-4">
        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
          <span>{train.fromCity}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span>{train.toCity}</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
          {train.fromStation} ➔ {train.toStation}
        </div>
      </td>
      <td className="p-4 font-mono">
        {train.departureTime} - {train.arrivalTime}
        <div className="text-[10px] text-slate-500 font-sans">{train.duration}</div>
      </td>
      <td className="p-4 font-black text-sm text-slate-900">
        {train.currency === 'EUR' ? '€' : train.currency} {train.basePrice}
      </td>
      <td className="p-4">
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
          {train.availableSeatsCount} asientos
        </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
            title="Editar"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
