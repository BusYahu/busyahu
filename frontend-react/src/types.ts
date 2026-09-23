export interface Destination {
  id: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  currency: string;
  currencySymbol: string;
  cities: { name: string; station: string }[];
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
  availableSeatsCount: number;
  amenities: string[];
  trainModel: string;
}

export interface Passenger {
  fullName: string;
  passportId: string;
  seatId: string;
  seatClass: 'tourist' | 'first' | 'business';
  price: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  train: TrainRoute;
  travelDate: string;
  passengers: Passenger[];
  totalPrice: number;
  currency: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}