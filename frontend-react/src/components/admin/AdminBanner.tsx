import { Lock, ShieldCheck } from 'lucide-react';

interface AdminBannerProps {
  activeBackend: 'express' | 'fastapi';
  onToggleBackend: (backend: 'express' | 'fastapi') => void;
  onSwitchUserRole: (role: 'client' | 'admin') => void;
}

export function AdminBanner({ activeBackend, onToggleBackend, onSwitchUserRole }: AdminBannerProps) {
  return (
    <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black tracking-tight text-white">
              Panel de Administración Ferroviaria
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Autenticado como role: admin
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de rutas internacionales (CRUD) y reporte de paridad multi-framework (Issue #09).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BackendSwitch activeBackend={activeBackend} onToggleBackend={onToggleBackend} />
        <button
          onClick={() => onSwitchUserRole('client')}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          Cambiar a Rol Cliente (Probar 403)
        </button>
      </div>
    </div>
  );
}

function BackendSwitch({ activeBackend, onToggleBackend }: Omit<AdminBannerProps, 'onSwitchUserRole'>) {
  const options: Array<{ id: 'express' | 'fastapi'; label: string; activeClass: string }> = [
    { id: 'express', label: 'Express (:4000)', activeClass: 'bg-emerald-600 text-white' },
    { id: 'fastapi', label: 'FastAPI (:8000)', activeClass: 'bg-blue-600 text-white' },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
      <span className="text-slate-400">Target Backend:</span>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onToggleBackend(option.id)}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            activeBackend === option.id ? option.activeClass : 'text-slate-400 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
