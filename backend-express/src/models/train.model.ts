import { ObjectId } from 'mongodb';

export interface IStation {
  id: string;
  name: string;
  city: string;
}

export interface IDestination {
  _id?: ObjectId;
  countryCode: string;
  countryName: string;
  networkName: string;
  currency: string;
  symbol: string;
  stations: IStation[];
}

export interface ICarriage {
  carriageNumber: number;
  classType: 'Standard' | 'First' | 'Business';
  totalSeats: number;
  rows: number;
  seatsPerRow: number;
}

export interface ITrain {
  _id?: ObjectId;
  code: string;
  countryCode: string;
  name: string;
  type: string;
  originStationId: string;
  destinationStationId: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  basePrice: number;
  carriages: ICarriage[];
}

export interface ISeatStatus {
  seatNumber: string;
  row: number;
  column: string;
  classType: 'Standard' | 'First' | 'Business';
  status: 'libre' | 'ocupado';
  price: number;
}

export interface ICarriageSeatsResponse {
  carriageNumber: number;
  classType: string;
  seats: ISeatStatus[];
}