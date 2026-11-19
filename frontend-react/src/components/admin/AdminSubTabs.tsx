import { Layers, Train } from 'lucide-react';

interface AdminTabsProps {
  activeSubTab: 'crud' | 'matrix';
  trainsCount: number;
  onChange: (tab: 'crud' | 'matrix') => void;
}

export function AdminTabs({ activeSubTab, trainsCount, onChange }: AdminTabsProps) {
  const tabClass = (tab: 'crud' | 'matrix') =>
    `px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
      activeSubTab === tab
        ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="flex border-b border-slate-200 gap-2">
      <button onClick={() => onChange('crud')} className={tabClass('crud')}>
        <Train className="w-4 h-4" />
        Gestión de Rutas y Trenes ({trainsCount})
      </button>
      <button onClick={() => onChange('matrix')} className={tabClass('matrix')}>
        <Layers className="w-4 h-4 text-emerald-600" />
        Matriz de Interoperabilidad 2x2 (Reporte Formal)
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
          4/4 PASS
        </span>
      </button>
    </div>
  );
}
