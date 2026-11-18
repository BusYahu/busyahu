import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from '../../mockData';
import type { Destination, TrainRoute } from '../../types';

export interface MockCatalog {
  destinations: Destination[];
  trains: TrainRoute[];
  getDestinations: () => Destination[];
  searchTrains: (filters?: Record<string, unknown>) => { total: number; trains: TrainRoute[] };
  getTrain: (trainId: string) => TrainRoute | null;
  getSeatMap: (trainId: string, date: string) => unknown;
}

export function buildMockDestinations(): Destination[] {
  return INITIAL_DESTINATIONS.map((destination) => ({
    ...destination,
    cities: destination.cities.map((city, index) => ({
      ...city,
      stationId: `${destination.countryCode}-${index + 1}`,
    })),
  }));
}

export function buildMockTrains(destinations: Destination[] = buildMockDestinations()): TrainRoute[] {
  return INITIAL_TRAIN_ROUTES.map((train) => ({
    ...train,
    countryCode:
      destinations.find(
        (destination) => destination.country.toLowerCase() === train.country.toLowerCase(),
      )?.countryCode ?? '',
  }));
}

function matchesFilters(train: TrainRoute, country: string, from: string, to: string): boolean {
  const matchCountry = country
    ? train.country.toLowerCase() === country ||
      (train.countryCode ?? '').toLowerCase() === country
    : true;
  const matchFrom = from
    ? train.fromCity.toLowerCase() === from || train.fromStation.toLowerCase().includes(from)
    : true;
  const matchTo = to
    ? train.toCity.toLowerCase() === to || train.toStation.toLowerCase().includes(to)
    : true;
  return matchCountry && matchFrom && matchTo;
}

function buildCarriages(train: TrainRoute | undefined) {
  return [1, 2, 3].map((carriageNumber) => {
    const classType = carriageNumber === 1 ? 'First' : 'Standard';
    return {
      carriageNumber,
      classType,
      seats: Array.from({ length: 6 }).flatMap((_, rowIndex) =>
        ['A', 'B', 'C', 'D'].map((column) => ({
          seatNumber: `${carriageNumber}-${rowIndex + 1}${column}`,
          row: rowIndex + 1,
          column,
          classType,
          status:
            rowIndex === 0 && (column === 'C' || column === 'D')
              ? ('ocupado' as const)
              : ('libre' as const),
          price: train ? Number((train.basePrice * (carriageNumber === 1 ? 1.4 : 1)).toFixed(2)) : 0,
        })),
      ),
    };
  });
}

export function createMockCatalog(): MockCatalog {
  const destinations = buildMockDestinations();
  const trains = buildMockTrains(destinations);

  function getDestinations(): Destination[] {
    return destinations;
  }

  function searchTrains(filters: Record<string, unknown> = {}): {
    total: number;
    trains: TrainRoute[];
  } {
    const country = String(filters.country ?? '').toLowerCase().trim();
    const from = String(filters.from ?? '').toLowerCase().trim();
    const to = String(filters.to ?? '').toLowerCase().trim();
    const result = trains.filter((train) => matchesFilters(train, country, from, to));
    return { total: result.length, trains: result };
  }

  function getTrain(trainId: string): TrainRoute | null {
    return trains.find((train) => train.id === trainId || train.trainNumber === trainId) ?? null;
  }

  function getSeatMap(trainId: string, date: string): unknown {
    const train = getTrain(trainId) ?? trains[0];
    const carriages = buildCarriages(train);

    return {
      trainId: train?.id ?? trainId,
      trainCode: train?.trainNumber ?? trainId,
      trainName: train ? `${train.operator} ${train.trainModel}` : trainId,
      date,
      totalCarriages: carriages.length,
      carriages,
    };
  }

  return { destinations, trains, getDestinations, searchTrains, getTrain, getSeatMap };
}
