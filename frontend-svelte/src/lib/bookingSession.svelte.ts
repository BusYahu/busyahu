import type { Booking, Passenger, TrainRoute, User } from '../types';
import { apiGateway } from './api.js';
import {
  buildDefaultBookings,
  buildLocalBooking,
  syncBooking,
  type BookingConfirmation,
} from './bookingFlow';
import { readCachedBookings, saveActiveBooking, saveCachedBookings } from './storage.js';

export interface BookingContext {
  selectedTrain: () => TrainRoute | null;
  travelDate: () => string;
  currentUser: () => User | null;
  currency: () => string;
  backend: () => 'express' | 'fastapi';
}

export function createBookingSession(context: BookingContext) {
  const cached = readCachedBookings() as Booking[];
  let bookings = $state<Booking[]>(cached.length ? cached : buildDefaultBookings());
  let activeBooking = $state<Booking | null>(null);

  $effect(() => saveCachedBookings(bookings));
  $effect(() => saveActiveBooking(activeBooking));

  const confirmedCount = $derived(
    bookings.filter((booking) => booking.status === 'confirmed').length,
  );

  function create(passengers: Passenger[], totalPrice: number, contactEmail?: string) {
    const train = context.selectedTrain();
    if (!train) return null;

    const confirmation: BookingConfirmation = {
      train,
      passengers,
      totalPrice,
      travelDate: context.travelDate(),
      currency: context.currency(),
      currentUser: context.currentUser(),
      contactEmail,
      activeBackend: context.backend(),
    };

    const localBooking = buildLocalBooking(confirmation);
    bookings = [localBooking, ...bookings];
    activeBooking = localBooking;

    void syncBooking(localBooking, confirmation).then((finalBooking) => {
      bookings = bookings.map((booking) =>
        booking.id === localBooking.id ? finalBooking : booking,
      );
      if (activeBooking?.id === localBooking.id) {
        activeBooking = finalBooking;
      }
    });

    return localBooking;
  }

  function cancel(bookingId: string) {
    bookings = bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking,
    );
    if (activeBooking?.id === bookingId) {
      activeBooking = { ...activeBooking, status: 'cancelled' };
    }
    void apiGateway.cancelBooking(bookingId).catch(() => {
      // La cancelación local se mantiene si el backend no responde.
    });
  }

  return {
    get bookings() {
      return bookings;
    },
    get activeBooking() {
      return activeBooking;
    },
    get confirmedCount() {
      return confirmedCount;
    },
    create,
    cancel,
    select(booking: Booking) {
      activeBooking = booking;
    },
  };
}
