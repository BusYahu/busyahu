import { useCallback, useEffect, useState } from 'react';
import type { TrainRoute } from '../types';
import { apiGateway, type BackendId } from '../lib/apiClient';
import type { AppView } from '../lib/appView';
import { scrollToSection, scrollToTop } from '../lib/scroll';

export function useAppNavigation(
  loadCatalog: () => Promise<void>,
  refreshHealth: () => Promise<unknown>,
) {
  const [currentView, setCurrentView] = useState<AppView>('search');
  const [selectedTrain, setSelectedTrain] = useState<TrainRoute | null>(null);
  const [activeBackend, setActiveBackend] = useState<BackendId>(() => apiGateway.getActiveBackend());

  useEffect(() => {
    void loadCatalog();
    return apiGateway.onBackendChanged((backend) => {
      setActiveBackend(backend);
      void loadCatalog();
    });
  }, [loadCatalog]);

  const goHome = useCallback(() => {
    setCurrentView('search');
    scrollToTop();
  }, []);

  const goTo = useCallback((view: AppView) => {
    setCurrentView(view);
    scrollToTop();
  }, []);

  const goToSection = useCallback((sectionId: string) => {
    setCurrentView('search');
    scrollToSection(sectionId);
  }, []);

  const switchBackend = useCallback((backend: BackendId) => {
    apiGateway.switchBackend(backend);
    setActiveBackend(backend);
  }, []);

  const retryAlternate = useCallback(() => {
    switchBackend(activeBackend === 'express' ? 'fastapi' : 'express');
  }, [activeBackend, switchBackend]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshHealth(), loadCatalog()]);
  }, [loadCatalog, refreshHealth]);

  const selectTrain = useCallback(
    (train: TrainRoute) => {
      setSelectedTrain(train);
      goTo('seat_selection');
    },
    [goTo],
  );

  return {
    currentView,
    selectedTrain,
    activeBackend,
    goHome,
    goTo,
    goToSection,
    switchBackend,
    retryAlternate,
    refreshAll,
    selectTrain,
  };
}
