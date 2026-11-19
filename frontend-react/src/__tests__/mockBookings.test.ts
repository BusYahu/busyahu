import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockBookings } from '../lib/mock/bookingsMock';

function makeBookings() {
  return createMockBookings({
    destinations: [
      {
        id: 'es',
        country: 'España',
        countryCode: 'ES',
        flagEmoji: '🇪🇸',
        currency: 'EUR',
        currencySymbol: '€',
        cities: [{ name: 'Madrid', station: 'Atocha', stationId: 'ES-MAD' }],
      },
    ],
    trains: [],
    getTrain: () => null,
  });
}

describe('reservas mock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T14:30:00Z'));
  });

  it('crea una reserva confirmada con asientos y QR', () => {
    const bookings = makeBookings();
    const booking = bookings.createBooking({
      travelDate: '2026-09-20',
      passengers: [
        { fullName: 'Ana Gomez', passportId: 'PAS-1', seatId: '1-1A', seatClass: 'first', price: 90 },
      ],
      totalPrice: 90,
      userEmail: 'ana@test.local',
    });

    expect(booking.status).toBe('confirmed');
    expect(booking.seats).toEqual(['1-1A']);
    expect(booking.qrPayload).toContain('ANA_GOMEZ');
    expect(booking.currency).toBe('EUR');
    expect(bookings.getMyBookings()).toHaveLength(1);
  });

  it('recupera reservas por id o código y cancela', () => {
    const bookings = makeBookings();
    const booking = bookings.createBooking({
      travelDate: '2026-09-20',
      passengers: [{ fullName: 'Ana', passportId: 'P', seatId: '1-1A', seatClass: 'tourist', price: 50 }],
      totalPrice: 50,
    });

    expect(bookings.getBooking(booking.id)?.id).toBe(booking.id);
    expect(bookings.getBooking(booking.bookingCode)?.id).toBe(booking.id);

    const cancelled = bookings.cancelBooking(booking.id);
    expect(cancelled?.status).toBe('cancelled');
    expect(bookings.getBooking(booking.id)?.status).toBe('cancelled');
  });

  it('devuelve null al cancelar una reserva inexistente', () => {
    const bookings = makeBookings();
    expect(bookings.cancelBooking('BK-NO-EXISTE')).toBeNull();
  });
});
