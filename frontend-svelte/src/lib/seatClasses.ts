import type { SeatClassTier } from './searchFilters';

export interface FareOption {
  id: SeatClassTier;
  label: string;
  detail: string;
  multiplier: number;
}

/** Tarifas comerciales por clase, compartidas por buscador y checkout. */
export const FARES: FareOption[] = [
  { id: 'tourist', label: 'Turista', detail: 'Estándar reclinable', multiplier: 1 },
  { id: 'first', label: 'Primera', detail: 'Extra espacio + café', multiplier: 1.4 },
  { id: 'business', label: 'Gran Clase', detail: 'Sala VIP + Menú', multiplier: 1.8 },
];

export function classMultiplier(seatClass: SeatClassTier): number {
  return FARES.find((fare) => fare.id === seatClass)?.multiplier ?? 1;
}

export function priceForClass(basePrice: number, seatClass: SeatClassTier): number {
  return Math.round(basePrice * classMultiplier(seatClass));
}
