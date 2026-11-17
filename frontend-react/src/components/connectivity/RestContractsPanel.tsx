import { CheckCircle2 } from 'lucide-react';
import { CONTRACT_ENDPOINTS } from '../../lib/apiClient';

export function RestContractsPanel() {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {CONTRACT_ENDPOINTS.map((contract) => (
          <div
            key={`${contract.method}-${contract.path}`}
            className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2"
          >
            <span className="font-mono text-[9px] font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded">
              {contract.method}
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[10px] text-slate-200 truncate">{contract.path}</div>
              <div className="text-[9px] text-slate-500 truncate">{contract.label}</div>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
