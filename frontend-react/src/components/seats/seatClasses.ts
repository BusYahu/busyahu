export type SeatClass = 'tourist' | 'first' | 'business';

export interface SeatClassOption {
  id: SeatClass;
  name: string;
  mult: number;
  desc: string;
}

export const SEAT_CLASSES: SeatClassOption[] = [
  { id: 'tourist', name: 'Turista Standard', mult: 1.0, desc: 'Wi-Fi 5G y toma USB' },
  { id: 'first', name: 'Primera Clase', mult: 1.4, desc: 'Asiento ancho + Silencio' },
  { id: 'business', name: 'Club / Business', mult: 1.8, desc: 'Catering en asiento' },
];

export function priceForClass(basePrice: number, seatClass: SeatClass): number {
  const option = SEAT_CLASSES.find((candidate) => candidate.id === seatClass) ?? SEAT_CLASSES[0];
  return Math.round(basePrice * option.mult);
}
