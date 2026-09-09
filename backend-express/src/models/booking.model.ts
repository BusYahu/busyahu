import { ObjectId } from 'mongodb';

export interface IPassenger {
  fullName: string;
  documentId: string;
  seatNumber: string;
}

export interface IBooking {
  _id?: ObjectId;
  bookingCode: string;       // Ej: BY-847291
  userId: string;
  userEmail: string;
  trainId: string;
  trainCode: string;
  trainName: string;
  originStationId: string;
  destinationStationId: string;
  date: string;              // Formato YYYY-MM-DD
  departureTime: string;
  seats: string[];           // Ej: ["1-2A", "1-2B"]
  passengers: IPassenger[];
  totalPrice: number;
  currency: string;
  status: 'confirmed' | 'cancelled';
  qrCodeDataUrl?: string;
  createdAt: Date;
}