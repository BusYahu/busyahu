import { normalizeBooking } from '../normalizers.js';
import { readCachedBookings, saveCachedBookings } from '../storage.js';

function nowString() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

function pseudoRandomBookingCode(train) {
  const prefix = (train?.countryCode || train?.country || 'RW').substring(0, 2).toUpperCase();
  const number = Math.floor(1000 + Math.random() * 9000);
  return `RW-${prefix}-${number}`;
}

export function createMockBookings({ destinations, trains, getTrain }) {
  let bookings = readCachedBookings();

  function getBooking(bookingId) {
    return (
      bookings.find(
        (booking) => booking.id === bookingId || booking.bookingCode === bookingId,
      ) ?? null
    );
  }

  function createBooking(payload) {
    const train = payload.train ?? getTrain(String(payload.trainId ?? '')) ?? trains[0];
    const bookingCode = pseudoRandomBookingCode(train);
    const passengers = (payload.passengers ?? []).map((passenger) => ({ ...passenger }));
    const firstName = (passengers[0]?.fullName ?? 'VIAJERO').toUpperCase().replace(/\s+/g, '_');
    const booking = {
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

  function cancelBooking(bookingId) {
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
    normalizeCachedBooking: (raw) => normalizeBooking(raw, destinations),
  };
}
