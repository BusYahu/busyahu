import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockBookings } from '../lib/mock/bookingsMock.js';

function makeBookings() {
  return createMockBookings({
    destinations: [{ id: 'es', country: 'España', countryCode: 'ES', currency: 'EUR', cities: [] }],
    trains: [],
    getTrain: () => null,
  });
}

describe('reservas mock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T14:30:00Z'));
  });

  it('crea una reserva confirmada con QR', () => {
    const bookings = makeBookings();
    const booking = bookings.createBooking({
      travelDate: '2026-09-20',
      passengers: [{ fullName: 'Ana Gomez', passportId: 'PAS-1', seatId: '1-1A', price: 90 }],
      totalPrice: 90,
    });

    expect(booking.status).toBe('confirmed');
    expect(booking.seats).toEqual(['1-1A']);
    expect(booking.qrPayload).toContain('ANA_GOMEZ');
    expect(bookings.getMyBookings()).toHaveLength(1);
  });

  it('cancela reservas existentes y devuelve null si no existe', () => {
    const bookings = makeBookings();
    const booking = bookings.createBooking({
      travelDate: '2026-09-20',
      passengers: [{ fullName: 'Ana', seatId: '1-1A', price: 50 }],
      totalPrice: 50,
    });

    expect(bookings.cancelBooking(booking.id)?.status).toBe('cancelled');
    expect(bookings.cancelBooking('BK-NO-EXISTE')).toBeNull();
  });
});
