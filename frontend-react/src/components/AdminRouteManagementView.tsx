import { useState } from 'react';
import type { Destination, TrainRoute, User } from '../types';
import { AdminBanner } from './admin/AdminBanner';
import { AdminTabs } from './admin/AdminSubTabs';
import { FeedbackBanner, type FeedbackMessage } from './admin/FeedbackBanner';
import { ParityMatrix } from './admin/ParityMatrix';
import { RbacGate } from './admin/RbacGate';
import { RouteFormModal } from './admin/RouteFormModal';
import { RouteTable } from './admin/RouteTable';

interface AdminRouteManagementViewProps {
  currentUser: User;
  onSwitchUserRole: (role: 'client' | 'admin') => void;
  trains: TrainRoute[];
  destinations: Destination[];
  onAddTrain: (train: TrainRoute) => void;
  onUpdateTrain: (train: TrainRoute) => void;
  onDeleteTrain: (trainId: string) => void;
  activeBackend: 'express' | 'fastapi';
  onToggleBackend: (backend: 'express' | 'fastapi') => void;
}

export function AdminRouteManagementView({
  currentUser,
  onSwitchUserRole,
  trains,
  destinations,
  onAddTrain,
  onUpdateTrain,
  onDeleteTrain,
  activeBackend,
  onToggleBackend,
}: AdminRouteManagementViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'crud' | 'matrix'>('crud');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage>(null);
  const [editingTrain, setEditingTrain] = useState<TrainRoute | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (currentUser.role !== 'admin') {
    return <RbacGate currentUser={currentUser} onSwitchUserRole={onSwitchUserRole} />;
  }

  const notify = (text: string) => {
    setFeedbackMessage({ text, type: 'success' });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const filteredTrains = trains.filter((train) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return [train.trainNumber, train.country, train.fromCity, train.toCity, train.operator].some(
      (value) => value.toLowerCase().includes(query),
    );
  });

  const handleSaveTrain = (train: TrainRoute, isEdit: boolean) => {
    if (isEdit) {
      onUpdateTrain(train);
      notify(`Ruta ${train.trainNumber} actualizada en ${activeBackend.toUpperCase()}`);
    } else {
      onAddTrain(train);
      notify(`Nueva ruta ${train.trainNumber} agregada con éxito`);
    }
    setIsFormOpen(false);
  };

  const handleDeleteWithFeedback = (trainId: string, trainNumber: string) => {
    if (window.confirm(`¿Confirmas eliminar la ruta ferroviaria ${trainNumber}?`)) {
      onDeleteTrain(trainId);
      notify(`Ruta ${trainNumber} eliminada del catálogo.`);
    }
  };

  return (
    <div className="space-y-6">
      <AdminBanner
        activeBackend={activeBackend}
        onToggleBackend={onToggleBackend}
        onSwitchUserRole={onSwitchUserRole}
      />

      {feedbackMessage && <FeedbackBanner message={feedbackMessage} />}

      <AdminTabs
        activeSubTab={activeSubTab}
        trainsCount={trains.length}
        onChange={setActiveSubTab}
      />

      {activeSubTab === 'crud' && (
        <RouteTable
          trains={filteredTrains}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenCreate={() => {
            setEditingTrain(null);
            setIsFormOpen(true);
          }}
          onEdit={(train) => {
            setEditingTrain(train);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteWithFeedback}
        />
      )}

      {activeSubTab === 'matrix' && <ParityMatrix />}

      {isFormOpen && (
        <RouteFormModal
          key={editingTrain?.id ?? 'new'}
          destinations={destinations}
          editingTrain={editingTrain}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveTrain}
        />
      )}
    </div>
  );
}
