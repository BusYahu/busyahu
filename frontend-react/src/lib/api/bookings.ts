import type { Booking, Destination, Passenger, TrainRoute } from '../../types';
import { canonicalSeatClass, normalizeBooking, normalizeBookings } from '../normalizers';
import type { MockBookingPayload } from '../mockAdapter';
import type { RequestFn } from './core';
import { readCachedBookings, saveCachedBookings } from '../storage';

export interface BookingMock {
  createBooking: (payload: MockBookingPayload) => Booking;
  getMyBookings: () => Booking[];
  getBooking: (bookingId: string) => Booking | null;
  cancelBooking: (bookingId: string) => Booking | null;
}

export interface BookingApi {
  createBooking: (payload: {
    trainId?: string;
    train?: TrainRoute;
    travelDate: string;
    passengers: Passenger[];
    totalPrice: number;
    currency?: string;
    userEmail?: string;
  }) => Promise<Booking>;
  getMyBookings: () => Promise<Booking[]>;
  getBooking: (bookingId: string) => Promise<Booking | null>;
  cancelBooking: (bookingId: string) => Promise<Booking | null>;
  generateQr: (payload: string) => Promise<{ qrCode: string; success: boolean; message?: string }>;
  sendTicketEmail: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export function createBookingApi(
  request: RequestFn,
  mock: BookingMock,
  getCachedDestinations: () => Destination[],
): BookingApi {
  async function createBooking(payload: {
    trainId?: string;
    train?: TrainRoute;
    travelDate: string;
    passengers: Passenger[];
    totalPrice: number;
    currency?: string;
    userEmail?: string;
  }): Promise<Booking> {
    // El backend FastAPI valida `train` como TrainSummary; enviamos solo `trainId`
    // y usamos el objeto de dominio únicamente para normalizar la respuesta/mock.
    const { train: _domainTrain, ...outbound } = payload;
    const body = {
      ...outbound,
      seats: payload.passengers.map((passenger) => passenger.seatId),
      passengers: payload.passengers.map((passenger) => ({
        ...passenger,
        seatClass: canonicalSeatClass(passenger.seatClass),
      })),
    };
    const result = await request<Booking>('/bookings', {
      method: 'POST',
      body,
      allowMock: true,
      mock: () => mock.createBooking({ ...body, passengers: payload.passengers }),
      normalize: (raw) => normalizeBooking(raw, getCachedDestinations(), payload.train ?? null),
    });
    const backend = result.meta.source === 'mock' ? 'mock' : result.meta.backend;
    const booking = { ...result.data, backend } as Booking;
    const cached = readCachedBookings();
    const withoutDuplicates = cached.filter(
      (item) => item.id !== booking.id && item.bookingCode !== booking.bookingCode,
    );
    saveCachedBookings([booking, ...withoutDuplicates]);
    return booking;
  }

  async function getMyBookings(): Promise<Booking[]> {
    const result = await request<Booking[]>('/bookings/my-bookings', {
      allowMock: true,
      mock: () => mock.getMyBookings(),
      normalize: (raw) => normalizeBookings(raw, getCachedDestinations()),
    });
    return result.data;
  }

  async function getBooking(bookingId: string): Promise<Booking | null> {
    const result = await request<Booking | null>(`/bookings/${encodeURIComponent(bookingId)}`, {
      allowMock: true,
      mock: () => mock.getBooking(bookingId),
      normalize: (raw) => normalizeBooking(raw, getCachedDestinations()),
    });
    return result.data;
  }

  async function cancelBooking(bookingId: string): Promise<Booking | null> {
    const result = await request<Booking | null>(`/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      allowMock: true,
      mock: () => mock.cancelBooking(bookingId),
      normalize: (raw) => {
        const cached = mock.getBooking(bookingId);
        return normalizeBooking(raw ?? cached, getCachedDestinations(), cached?.train);
      },
    });
    if (result.data) {
      const cached = readCachedBookings();
      saveCachedBookings(
        cached.map((booking) =>
          booking.id === result.data?.id || booking.bookingCode === result.data?.bookingCode
            ? { ...booking, status: 'cancelled' }
            : booking,
        ),
      );
    }
    return result.data;
  }

  async function generateQr(
    payload: string,
  ): Promise<{ qrCode: string; success: boolean; message?: string }> {
    const result = await request<Record<string, unknown>>('/bookings/qr', {
      method: 'POST',
      body: { data: payload },
      allowMock: true,
      mock: () => ({
        success: false,
        qrCode: '',
        message: 'Generación de QR no disponible sin backend.',
      }),
      normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
    });
    return {
      success: Boolean(result.data.success ?? Boolean(result.data.qrCode)),
      qrCode: String(result.data.qrCode ?? ''),
      message: result.data.message ? String(result.data.message) : undefined,
    };
  }

  async function sendTicketEmail(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result = await request<Record<string, unknown>>('/bookings/send-direct-email', {
      method: 'POST',
      body: payload,
      normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
    });
    return result.data;
  }

  return {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking,
    generateQr,
    sendTicketEmail,
  };
}
