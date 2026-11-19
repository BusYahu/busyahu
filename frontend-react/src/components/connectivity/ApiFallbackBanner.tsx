import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { BACKENDS, type BackendId } from '../../lib/apiClient';

interface ApiFallbackBannerProps {
  error: string;
  alternate: BackendId;
  onRetryAlternate: () => void;
}

export function ApiFallbackBanner({ error, alternate, onRetryAlternate }: ApiFallbackBannerProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 pb-2">
      <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-200 rounded-lg px-3 py-2 text-[11px]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-[220px]">
          {error} Se muestran datos locales para no romper la interfaz.
        </span>
        <button
          type="button"
          onClick={onRetryAlternate}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-400 text-slate-950 font-bold hover:bg-amber-300"
        >
          <ArrowRightLeft className="w-3 h-3" />
          Reintentar en {BACKENDS[alternate].shortLabel}
        </button>
      </div>
    </div>
  );
}
