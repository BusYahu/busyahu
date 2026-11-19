import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from '../data';
import type { Destination, TrainRoute } from '../types';
import { apiGateway } from './api.js';
import { getActiveBackend, setEnvironment } from './storage.js';

export type BackendId = 'express' | 'fastapi';

export function createAppRuntime() {
  let activeBackend = $state<BackendId>(getActiveBackend());
  let health = $state<any>(apiGateway.getHealthSnapshot());
  let lastResult = $state<any>(apiGateway.lastResult);
  let catalogLoading = $state(false);
  let destinations = $state<Destination[]>(INITIAL_DESTINATIONS);
  let trains = $state<TrainRoute[]>(INITIAL_TRAIN_ROUTES);

  async function loadCatalog() {
    catalogLoading = true;
    try {
      const [nextDestinations, nextTrains] = await Promise.all([
        apiGateway.getDestinations(),
        apiGateway.getTrains()
      ]);
      if (nextDestinations.length) destinations = nextDestinations as Destination[];
      if (nextTrains.length) trains = nextTrains as TrainRoute[];
    } finally {
      catalogLoading = false;
    }
  }

  async function refreshAll() {
    const [snapshot] = await Promise.all([apiGateway.checkAllHealth(), loadCatalog()]);
    health = snapshot;
  }

  function switchBackend(backend: BackendId) {
    apiGateway.switchBackend(backend);
    activeBackend = backend;
    void loadCatalog();
  }

  function retryAlternate() {
    switchBackend(activeBackend === 'express' ? 'fastapi' : 'express');
  }

  function start() {
    setEnvironment('svelte');
    void loadCatalog();
    const stopHealthPolling = apiGateway.startHealthPolling((snapshot: any) => {
      health = snapshot;
    }, 15000);
    const unsubscribeBackend = apiGateway.onBackendChanged((backend: BackendId) => {
      activeBackend = backend;
      void loadCatalog();
    });
    const unsubscribeApi = apiGateway.onApiEvent((meta: any) => {
      lastResult = meta;
    });

    return () => {
      stopHealthPolling();
      unsubscribeBackend();
      unsubscribeApi();
    };
  }

  return {
    get activeBackend() {
      return activeBackend;
    },
    get health() {
      return health;
    },
    get lastResult() {
      return lastResult;
    },
    get catalogLoading() {
      return catalogLoading;
    },
    get destinations() {
      return destinations;
    },
    get trains() {
      return trains;
    },
    loadCatalog,
    refreshAll,
    switchBackend,
    retryAlternate,
    start
  };
}
