import type { Destination, TrainRoute } from '../../types';
import {
  normalizeDestinations,
  normalizeSeatMap,
  normalizeTrains,
  type NormalizedSeatMap,
} from '../normalizers';
import type { ApiMeta, RequestFn } from './core';

export interface CatalogMock {
  getDestinations: () => Destination[];
  searchTrains: (filters: Record<string, unknown>) => { total: number; trains: TrainRoute[] };
  getTrain: (trainId: string) => TrainRoute | null;
  getSeatMap: (trainId: string, date: string) => unknown;
}

export interface CatalogApi {
  getDestinations: () => Promise<Destination[]>;
  getTrains: (filters?: Record<string, string | number | undefined>) => Promise<TrainRoute[]>;
  getCatalog: (filters?: Record<string, string | number | undefined>) => Promise<{
    destinations: Destination[];
    trains: TrainRoute[];
    meta: ApiMeta;
  }>;
  getTrain: (trainId: string) => Promise<TrainRoute | null>;
  getSeatMap: (trainId: string, date?: string) => Promise<NormalizedSeatMap>;
  searchTrains: (
    filters?: Record<string, string | number | undefined>,
  ) => Promise<{ total: number; trains: TrainRoute[] }>;
  getCachedDestinations: () => Destination[];
}

export function createCatalogApi(
  request: RequestFn,
  mock: CatalogMock,
  getLastMeta: () => ApiMeta,
): CatalogApi {
  let destinationCache: Destination[] = [];

  function getCachedDestinations(): Destination[] {
    return destinationCache.length ? destinationCache : mock.getDestinations();
  }

  async function getDestinations(): Promise<Destination[]> {
    const result = await request<Destination[]>('/destinations', {
      allowMock: true,
      mock: () => mock.getDestinations(),
      normalize: (raw) => normalizeDestinations(raw),
    });
    if (result.data.length) destinationCache = result.data;
    return result.data;
  }

  async function getTrains(
    filters: Record<string, string | number | undefined> = {},
  ): Promise<TrainRoute[]> {
    const result = await request<TrainRoute[]>('/trains/search', {
      query: filters,
      allowMock: true,
      mock: () => mock.searchTrains(filters).trains,
      normalize: (raw) => normalizeTrains(raw, getCachedDestinations()),
    });
    return result.data;
  }

  async function getCatalog(
    filters: Record<string, string | number | undefined> = {},
  ): Promise<{ destinations: Destination[]; trains: TrainRoute[]; meta: ApiMeta }> {
    const destinations = await getDestinations();
    const trains = await getTrains(filters);
    return { destinations, trains, meta: getLastMeta() };
  }

  async function getTrain(trainId: string): Promise<TrainRoute | null> {
    const result = await request<TrainRoute | null>(`/trains/${encodeURIComponent(trainId)}`, {
      allowMock: true,
      mock: () => mock.getTrain(trainId),
      normalize: (raw) => normalizeTrains({ trains: [raw] }, getCachedDestinations())[0] ?? null,
    });
    return result.data;
  }

  async function getSeatMap(trainId: string, date?: string): Promise<NormalizedSeatMap> {
    const result = await request<NormalizedSeatMap>(
      `/trains/${encodeURIComponent(trainId)}/seats`,
      {
        query: date ? { date } : undefined,
        allowMock: true,
        mock: () => mock.getSeatMap(trainId, date ?? new Date().toISOString().slice(0, 10)),
        normalize: (raw) => normalizeSeatMap(raw),
      },
    );
    return result.data;
  }

  async function searchTrains(
    filters: Record<string, string | number | undefined> = {},
  ): Promise<{ total: number; trains: TrainRoute[] }> {
    const trains = await getTrains(filters);
    return { total: trains.length, trains };
  }

  return {
    getDestinations,
    getTrains,
    getCatalog,
    getTrain,
    getSeatMap,
    searchTrains,
    getCachedDestinations,
  };
}
