import { ObjectId } from 'mongodb';

export interface IBookingPassenger {
  fullName: string;
  passportId: string;
  seatId: string;
  seatClass: 'Standard' | 'First' | 'Business';
  price: number;
}

export interface IBookingTrainSummary {
  id: string;
  code: string;
  countryCode: string;
  name: string;
  type: string;
  originStationId: string;
  destinationStationId: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  basePrice: number;
}

export interface IBooking {
  _id?: ObjectId;
  bookingCode: string;
  train: IBookingTrainSummary;
  trainId: string;
  date: string;
  travelDate: string;
  seats: string[];
  passengers: IBookingPassenger[];
  totalPrice: number;
  currency: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
  qrPayload: string;
  qrCode?: string;
  userEmail: string;
  userId?: string;
  cancelledAt?: string;
}
