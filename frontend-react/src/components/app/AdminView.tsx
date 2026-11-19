import type { Destination, TrainRoute, User } from '../../types';
import type { ApiMeta, BackendId, HealthMap } from '../../lib/apiClient';
import { AdminRouteManagementView } from '../AdminRouteManagementView';
import { ConnectivityHub } from '../ConnectivityHub';
import { BackToSearchButton } from './BookingsPage';

interface AdminViewProps {
  currentUser: User;
  onSwitchUserRole: (role: 'client' | 'admin') => void;
  trains: TrainRoute[];
  destinations: Destination[];
  onAddTrain: (train: TrainRoute) => void;
  onUpdateTrain: (train: TrainRoute) => void;
  onDeleteTrain: (trainId: string) => void;
  activeBackend: BackendId;
  onToggleBackend: (backend: BackendId) => void;
  health: HealthMap;
  lastResult: ApiMeta;
  loading: boolean;
  onRefresh: () => void;
  onRetryAlternate: () => void;
  onGoHome: () => void;
}

export function AdminView({
  currentUser,
  onSwitchUserRole,
  trains,
  destinations,
  onAddTrain,
  onUpdateTrain,
  onDeleteTrain,
  activeBackend,
  onToggleBackend,
  health,
  lastResult,
  loading,
  onRefresh,
  onRetryAlternate,
  onGoHome,
}: AdminViewProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <BackToSearchButton onClick={onGoHome} label="Volver a la web pública" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-rose-700">
          Acceso restringido · RBAC
        </span>
      </div>

      <ConnectivityHub
        activeBackend={activeBackend}
        health={health}
        lastResult={lastResult}
        loading={loading}
        onSwitchBackend={onToggleBackend}
        onRefresh={onRefresh}
        onRetryAlternate={onRetryAlternate}
      />

      <div className="mt-6">
        <AdminRouteManagementView
          currentUser={currentUser}
          onSwitchUserRole={onSwitchUserRole}
          trains={trains}
          destinations={destinations}
          onAddTrain={onAddTrain}
          onUpdateTrain={onUpdateTrain}
          onDeleteTrain={onDeleteTrain}
          activeBackend={activeBackend}
          onToggleBackend={onToggleBackend}
        />
      </div>
    </div>
  );
}
