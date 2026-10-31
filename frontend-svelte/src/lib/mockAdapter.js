import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from '../data';
import { canonicalSeatClass, normalizeBooking } from './normalizers.js';
import { readCachedBookings, saveCachedBookings } from './storage.js';

export function buildMockDestinations() {
  return INITIAL_DESTINATIONS.map((destination) => ({
    ...destination,
    cities: destination.cities.map((city, index) => ({
      ...city,
      stationId: city.stationId ?? `${destination.countryCode}-${index + 1}`,
    })),
  }));
}

export function buildMockTrains(destinations = buildMockDestinations()) {
  return INITIAL_TRAIN_ROUTES.map((train) => ({
    ...train,
    countryCode:
      train.countryCode ??
      destinations.find(
        (destination) => destination.country.toLowerCase() === train.country.toLowerCase(),
      )?.countryCode ??
      '',
  }));
}

function nowString() {
  return new Date().toISOString().replace('T', ' ').substring(0, 16);
}

function pseudoRandomBookingCode(train) {
  const prefix = (train?.countryCode || train?.country || 'RW').substring(0, 2).toUpperCase();
  const number = Math.floor(1000 + Math.random() * 9000);
  return `RW-${prefix}-${number}`;
}

export class MockAdapter {
  constructor() {
    this.destinations = buildMockDestinations();
    this.trains = buildMockTrains(this.destinations);
    this.bookings = readCachedBookings();
  }

  getDestinations() {
    return this.destinations;
  }

  searchTrains(filters = {}) {
    const country = String(filters.country ?? '').toLowerCase().trim();
    const from = String(filters.from ?? '').toLowerCase().trim();
    const to = String(filters.to ?? '').toLowerCase().trim();

    const trains = this.trains.filter((train) => {
      const matchCountry = country
        ? train.country.toLowerCase() === country ||
          (train.countryCode ?? '').toLowerCase() === country
        : true;
      const matchFrom = from
        ? train.fromCity.toLowerCase() === from || train.fromStation.toLowerCase().includes(from)
        : true;
      const matchTo = to
        ? train.toCity.toLowerCase() === to || train.toStation.toLowerCase().includes(to)
        : true;
      return matchCountry && matchFrom && matchTo;
    });

    return { total: trains.length, trains };
  }

  getTrain(trainId) {
    return this.trains.find((train) => train.id === trainId || train.trainNumber === trainId) ?? null;
  }

  getSeatMap(trainId, date) {
    const train = this.getTrain(trainId) ?? this.trains[0];
    const carriages = [1, 2, 3].map((carriageNumber) => ({
      carriageNumber,
      classType: carriageNumber === 1 ? 'First' : 'Standard',
      seats: Array.from({ length: 6 }).flatMap((_, rowIndex) =>
        ['A', 'B', 'C', 'D'].map((column) => ({
          seatNumber: `${carriageNumber}-${rowIndex + 1}${column}`,
          row: rowIndex + 1,
          column,
          classType: carriageNumber === 1 ? 'First' : 'Standard',
          status: rowIndex === 0 && (column === 'C' || column === 'D') ? 'ocupado' : 'libre',
          price: train ? Number((train.basePrice * (carriageNumber === 1 ? 1.4 : 1)).toFixed(2)) : 0,
        })),
      ),
    }));

    return {
      trainId: train?.id ?? trainId,
      trainCode: train?.trainNumber ?? trainId,
      trainName: train ? `${train.operator} ${train.trainModel}` : trainId,
      date,
      totalCarriages: carriages.length,
      carriages,
    };
  }

  createBooking(payload) {
    const train =
      payload.train ?? this.getTrain(String(payload.trainId ?? '')) ?? this.trains[0];

    const bookingCode = pseudoRandomBookingCode(train);
    const passengers = (payload.passengers ?? []).map((passenger) => ({
      ...passenger,
      seatClass: passenger.seatClass,
    }));
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

    this.bookings = [booking, ...this.bookings];
    saveCachedBookings(this.bookings);
    return booking;
  }

  getMyBookings() {
    return this.bookings;
  }

  getBooking(bookingId) {
    return (
      this.bookings.find(
        (booking) => booking.id === bookingId || booking.bookingCode === bookingId,
      ) ?? null
    );
  }

  cancelBooking(bookingId) {
    const booking = this.getBooking(bookingId);
    if (!booking) return null;
    booking.status = 'cancelled';
    saveCachedBookings(this.bookings);
    return normalizeBooking(booking, this.destinations);
  }

  normalizeCachedBooking(raw) {
    return normalizeBooking(raw, this.destinations);
  }

  canonicalSeatClass(value) {
    return canonicalSeatClass(value);
  }
}
