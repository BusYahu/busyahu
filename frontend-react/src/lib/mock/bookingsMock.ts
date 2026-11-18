import type { Booking, Destination, Passenger, TrainRoute } from '../../types';
import { normalizeBooking } from '../normalizers';
import { readCachedBookings, saveCachedBookings } from '../storage';

export interface MockBookingPayload {
  trainId?: string;
  train?: TrainRoute;
  travelDate: string;
  passengers: Passenger[];
  totalPrice: number;
  currency?: string;
  userEmail?: string;
}

export interface MockBookingsDeps {
  destinations: Destination[];
  trains: TrainRoute[];
  getTrain: (trainId: string) => TrainRoute | null;
}

export interface MockBookings {
  createBooking: (payload: MockBookingPayload) => Booking;
  getMyBookings: () => Booking[];
  getBooking: (bookingId: string) => Booking | null;
  cancelBooking: (bookingId: string) => Booking | null;
  normalizeCachedBooking: (raw: unknown) => Booking;
}

function nowString(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

function pseudoRandomBookingCode(train: TrainRoute | undefined): string {
  const prefix = (train?.countryCode || train?.country || 'RW').substring(0, 2).toUpperCase();
  const number = Math.floor(1000 + Math.random() * 9000);
  return `RW-${prefix}-${number}`;
}

export function createMockBookings({ destinations, trains, getTrain }: MockBookingsDeps): MockBookings {
  let bookings = readCachedBookings() as Booking[];

  function getBooking(bookingId: string): Booking | null {
    return (
      bookings.find((booking) => booking.id === bookingId || booking.bookingCode === bookingId) ??
      null
    );
  }

  function createBooking(payload: MockBookingPayload): Booking {
    const train = payload.train ?? getTrain(String(payload.trainId ?? '')) ?? trains[0];
    const bookingCode = pseudoRandomBookingCode(train);
    const passengers = (payload.passengers ?? []).map((passenger) => ({ ...passenger }));
    const firstName = (passengers[0]?.fullName ?? 'VIAJERO').toUpperCase().replace(/\s+/g, '_');
    const booking: Booking = {
      id: `BK-MOCK-${Date.now()}`,
      bookingCode,
      train,
      trainId: train?.id,
      travelDate: payload.travelDate,
      date: payload.travelDate,
      seats: passengers.map((passenger) => passenger.seatId),
      passengers,
      totalPrice: Number(payload.totalPrice ?? 0),
      currency: payload.currency ?? train?.currency ?? 'EUR',
      createdAt: nowString(),
      status: 'confirmed',
      qrPayload: `RAILWORLD-VERIFIED:${bookingCode}:${train?.trainNumber ?? ''}:${firstName}`,
      userEmail: payload.userEmail ?? '',
      backend: 'mock',
    };

    bookings = [booking, ...bookings];
    saveCachedBookings(bookings);
    return booking;
  }

  function cancelBooking(bookingId: string): Booking | null {
    const booking = getBooking(bookingId);
    if (!booking) return null;
    booking.status = 'cancelled';
    saveCachedBookings(bookings);
    return normalizeBooking(booking, destinations);
  }

  return {
    createBooking,
    getMyBookings: () => bookings,
    getBooking,
    cancelBooking,
    normalizeCachedBooking: (raw: unknown) => normalizeBooking(raw, destinations),
  };
}
