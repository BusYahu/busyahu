import type { TrainRoute } from '../../types';

export const INPUT_CLASS = 'w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl';

export const ROUTE_FALLBACKS = {
  operator: 'Renfe AVE',
  fromStation: 'Madrid-Puerta de Atocha',
  toStation: 'València-Joaquín Sorolla',
  duration: '1h 45m',
  currency: 'EUR',
  trainModel: 'Siemens Velaro S-103',
  availableSeatsCount: 50,
  amenities: ['Wi-Fi 5G', 'Coche Cafetería', 'Enchufes USB-C'],
};

export interface RouteFormValues {
  country: string;
  trainNumber: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
  currency: string;
}

export function randomTrainNumber(): string {
  return `AVE ${Math.floor(1000 + Math.random() * 9000)}`;
}

export function buildInitialRouteValues(train: TrainRoute | null): RouteFormValues {
  return {
    country: train?.country ?? 'España',
    trainNumber: train?.trainNumber ?? randomTrainNumber(),
    fromCity: train?.fromCity ?? 'Madrid',
    toCity: train?.toCity ?? 'Valencia',
    departureTime: train?.departureTime ?? '10:30',
    arrivalTime: train?.arrivalTime ?? '12:15',
    basePrice: train?.basePrice ?? 48,
    currency: train?.currency ?? ROUTE_FALLBACKS.currency,
  };
}

export function buildRouteFromForm(
  values: RouteFormValues,
  editingTrain: TrainRoute | null,
): TrainRoute {
  const base: Partial<TrainRoute> = editingTrain ?? {};
  return {
    id: base.id ?? `route-${Date.now()}`,
    trainNumber: values.trainNumber,
    operator: base.operator ?? ROUTE_FALLBACKS.operator,
    country: values.country,
    fromCity: values.fromCity,
    fromStation: base.fromStation ?? ROUTE_FALLBACKS.fromStation,
    toCity: values.toCity,
    toStation: base.toStation ?? ROUTE_FALLBACKS.toStation,
    departureTime: values.departureTime,
    arrivalTime: values.arrivalTime,
    duration: base.duration ?? ROUTE_FALLBACKS.duration,
    basePrice: Number(values.basePrice),
    currency: values.currency,
    trainModel: base.trainModel ?? ROUTE_FALLBACKS.trainModel,
    availableSeatsCount: base.availableSeatsCount ?? ROUTE_FALLBACKS.availableSeatsCount,
    amenities: base.amenities ?? ROUTE_FALLBACKS.amenities,
  };
}
