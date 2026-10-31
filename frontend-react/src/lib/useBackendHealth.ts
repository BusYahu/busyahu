import { useCallback, useEffect, useState } from 'react';
import { apiGateway, type ApiMeta, type HealthMap } from './apiClient';

export function useBackendHealth(intervalMs = 15000) {
  const [health, setHealth] = useState<HealthMap>(() => apiGateway.getHealthSnapshot());
  const [lastResult, setLastResult] = useState<ApiMeta>(() => apiGateway.lastResult);

  const refresh = useCallback(async () => {
    const snapshot = await apiGateway.checkAllHealth();
    setHealth(snapshot);
    return snapshot;
  }, []);

  useEffect(() => {
    const stopPolling = apiGateway.startHealthPolling(setHealth, intervalMs);
    const unsubscribeApi = apiGateway.onApiEvent(setLastResult);
    return () => {
      stopPolling();
      unsubscribeApi();
    };
  }, [intervalMs]);

  return { health, lastResult, refresh, setLastResult };
}
