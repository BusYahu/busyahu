import { Lock, ShieldAlert, Unlock } from 'lucide-react';
import type { User } from '../../types';

interface RbacGateProps {
  currentUser: User;
  onSwitchUserRole: (role: 'client' | 'admin') => void;
}

export function RbacGate({ currentUser, onSwitchUserRole }: RbacGateProps) {
  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-indigo-600/30 border border-indigo-500/50 rounded-xl text-indigo-400">
            <Lock className="w-5 h-5" />
          </span>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              Simulador de Permisos (RBAC)
              <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded font-mono">
                Rol Actual: {currentUser.role.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Para validar el criterio de aceptación, puedes alternar entre Cliente y Administrador.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSwitchUserRole('admin')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <Unlock className="w-3.5 h-3.5" />
          Elevar a Rol Administrador (role: admin)
        </button>
      </div>

      <div className="bg-white border-2 border-rose-300 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-mono font-bold tracking-wide mb-3 border border-rose-200">
          HTTP STATUS 403 • FORBIDDEN ACCESS
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
          Acceso Denegado al Panel de Control Ferroviario
        </h2>

        <p className="text-slate-600 max-w-lg mx-auto text-sm sm:text-base leading-relaxed mb-6">
          El recurso{' '}
          <code className="bg-slate-100 px-2 py-0.5 rounded text-rose-600 font-mono text-xs">
            /admin/trains
          </code>{' '}
          requiere privilegios de <strong className="text-slate-800">Administrador de Red</strong>.
          Tu usuario autenticado tiene el rol{' '}
          <strong className="text-slate-800 font-mono">client</strong> (cliente), sin privilegios de
          administración.
        </p>

        <button
          onClick={() => onSwitchUserRole('admin')}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto"
        >
          <Unlock className="w-4 h-4" />
          Iniciar Sesión como Administrador
        </button>
      </div>
    </div>
  );
}
