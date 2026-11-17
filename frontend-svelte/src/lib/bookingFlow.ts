import { INITIAL_TRAIN_ROUTES } from '../data';
import type { Booking, Passenger, TrainRoute, User } from '../types';
import { apiGateway } from './api.js';

export type BackendId = 'express' | 'fastapi';

export interface BookingConfirmation {
  train: TrainRoute;
  passengers: Passenger[];
  totalPrice: number;
  travelDate: string;
  currency: string;
  currentUser: User | null;
  contactEmail?: string;
  activeBackend: BackendId;
}

export function buildDefaultBookings(): Booking[] {
  return [
    {
      id: 'BK-1001',
      bookingCode: 'RW-ES-9841',
      train: INITIAL_TRAIN_ROUTES[0],
      travelDate: '2026-09-20',
      passengers: [
        {
          fullName: 'Lucas Gómez',
          passportId: 'PAS-459201',
          seatId: '2-A',
          seatClass: 'tourist',
          price: 65
        }
      ],
      totalPrice: 65,
      currency: 'EUR',
      createdAt: '2026-08-14 09:30',
      status: 'confirmed',
      qrPayload: 'RAILWORLD:RW-ES-9841:MAD-BCN:LUCAS_GOMEZ',
      userEmail: 'viajero@busyahurail.com'
    }
  ];
}

export function buildLocalBooking(confirmation: BookingConfirmation): Booking {
  const { train, passengers, totalPrice, travelDate, currency, currentUser, contactEmail } =
    confirmation;
  const targetEmail = currentUser?.email || contactEmail || 'viajero@busyahurail.com';
  const qrPayload = `BUSYAHU-TICKET:${train.trainNumber}:${passengers[0]?.fullName}:${train.fromCity}-${train.toCity}`;

  return {
    id: `BK-${Date.now()}`,
    bookingCode: `RW-${(train.countryCode || train.country).substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    train,
    trainId: train.id,
    travelDate,
    date: travelDate,
    seats: passengers.map((passenger) => passenger.seatId),
    passengers,
    totalPrice,
    currency,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'confirmed',
    qrPayload,
    qrCode: '',
    userEmail: targetEmail,
    userId: currentUser?.id,
    userDni: currentUser?.dni || passengers[0]?.passportId,
    backend: confirmation.activeBackend
  };
}

export async function syncBooking(
  local: Booking,
  confirmation: BookingConfirmation
): Promise<Booking> {
  const { train, passengers, totalPrice, travelDate, currency, activeBackend } = confirmation;

  let synchronized: Booking | null = null;
  try {
    synchronized = await apiGateway.createBooking({
      trainId: train.id,
      train,
      travelDate,
      passengers,
      totalPrice,
      currency,
      userEmail: local.userEmail
    });
  } catch {
    // La reserva local se conserva si el backend no está disponible.
  }

  let qrCode = '';
  try {
    const qr = await apiGateway.generateQr(local.qrPayload);
    qrCode = qr.qrCode;
  } catch {
    // El QR se resolverá con el payload local.
  }

  return {
    ...(synchronized ?? local),
    train: synchronized?.train?.fromCity ? synchronized.train : train,
    passengers: synchronized?.passengers?.length ? synchronized.passengers : passengers,
    qrCode: synchronized?.qrCode || qrCode || local.qrCode,
    qrPayload: synchronized?.qrPayload || local.qrPayload,
    backend: synchronized?.backend ?? activeBackend
  };
}
