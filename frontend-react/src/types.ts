export interface Destination {
  id: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  currency: string;
  currencySymbol: string;
  cities: {
    name: string;
    station: string;
  }[];
}

export interface TrainSeat {
  id: string;
  carNumber: number;
  row: number;
  column: string;
  type: 'window' | 'aisle' | 'table';
  class: 'tourist' | 'first' | 'business';
  price: number;
  isOccupied: boolean;
}

export interface TrainRoute {
  id: string;
  trainNumber: string;
  operator: string;
  country: string;
  fromCity: string;
  fromStation: string;
  toCity: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  basePrice: number;
  currency: string;
  trainModel: string;
  availableSeatsCount: number;
  amenities: string[];
}

export interface Passenger {
  fullName: string;
  passportId: string;
  seatId: string;
  seatClass: 'tourist' | 'first' | 'business';
  price: number;
}

// ⚡ AQUÍ ESTÁ EL ARREGLO DE LA IMAGEN 2 Y 3:
export interface Booking {
  id: string;
  bookingCode: string;
  train: TrainRoute;
  travelDate: string;
  passengers: Passenger[];
  totalPrice: number;
  currency: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
  qrPayload?: string;   // <-- ¡Esto quita el rojo de qrPayload!
  userEmail?: string;
}

// ⚡ AQUÍ ESTÁ EL ARREGLO DE LA IMAGEN 1:
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin';
}

export interface ProjectIssue {
  id: string;
  number: number;
  title: string;
  conventionalCommit: string;
  phase: string;
  objective: string;
  scopeIncluded: string[];
  scopeExcluded: string[];
  acceptanceCriteria: string[];
  dependencies: string[];
  evidences: string[];
  status: 'approved' | 'in_progress' | 'ready_for_review' | 'completed' | 'planned';
  assignee: 'Integrante 1' | 'Integrante 2' | 'Ambos';
  prTitle?: string;
}