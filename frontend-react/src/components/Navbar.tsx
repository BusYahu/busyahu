import { Train, Ticket, Search } from 'lucide-react';

interface NavbarProps {
  currentTab: 'search' | 'bookings';
  onSelectTab: (tab: 'search' | 'bookings') => void;
  activeBackend: 'express' | 'fastapi';
  onToggleBackend: (backend: 'express' | 'fastapi') => void;
  bookingsCount: number;
}

export function Navbar({
  currentTab,
  onSelectTab,
  activeBackend,
  onToggleBackend,
  bookingsCount,
}: NavbarProps) {
  return (
    <header className="bg-slate-950 text-white border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Logo */}
        <div 
          onClick={() => onSelectTab('search')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                BusYahu
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono font-bold">
                PROG 3
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              11 Países • Red Ferroviaria Internacional
            </p>
          </div>
        </div>

        {/* Criterio 2: Selector Express :4000 vs FastAPI :8000 */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs shadow-inner">
          <span className="text-slate-400 font-medium text-[11px]">Backend Activo:</span>
          <button
            type="button"
            id="switch-backend-express"
            onClick={() => onToggleBackend('express')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeBackend === 'express'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeBackend === 'express' ? 'bg-white' : 'bg-slate-500'}`}></span>
            ⚡ Express (:4000)
          </button>
          <button
            type="button"
            id="switch-backend-fastapi"
            onClick={() => onToggleBackend('fastapi')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeBackend === 'fastapi'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeBackend === 'fastapi' ? 'bg-white' : 'bg-slate-500'}`}></span>
            🐍 FastAPI (:8000)
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <nav className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'search'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscador</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('bookings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'bookings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Mis Billetes</span>
            {bookingsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {bookingsCount}
              </span>
            )}
          </button>
        </nav>

      </div>
    </header>
  );
}