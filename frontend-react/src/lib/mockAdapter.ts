import type { Booking, Destination, TrainRoute } from '../types';
import { createMockBookings, type MockBookingPayload } from './mock/bookingsMock';
import { buildMockDestinations, buildMockTrains, createMockCatalog } from './mock/catalogMock';

export type { MockBookingPayload };

export interface MockAdapter {
  getDestinations: () => Destination[];
  searchTrains: (filters?: Record<string, unknown>) => { total: number; trains: TrainRoute[] };
  getTrain: (trainId: string) => TrainRoute | null;
  getSeatMap: (trainId: string, date: string) => unknown;
  createBooking: (payload: MockBookingPayload) => Booking;
  getMyBookings: () => Booking[];
  getBooking: (bookingId: string) => Booking | null;
  cancelBooking: (bookingId: string) => Booking | null;
  normalizeCachedBooking: (raw: unknown) => Booking;
}

export { buildMockDestinations, buildMockTrains };

/**
 * Fachada del adaptador mock: compone los dobles por dominio (catálogo y
 * reservas) manteniendo la interfaz histórica que consumen los servicios.
 */
export function createMockAdapter(): MockAdapter {
  const catalog = createMockCatalog();
  const bookings = createMockBookings({
    destinations: catalog.destinations,
    trains: catalog.trains,
    getTrain: catalog.getTrain,
  });

  return {
    getDestinations: catalog.getDestinations,
    searchTrains: catalog.searchTrains,
    getTrain: catalog.getTrain,
    getSeatMap: catalog.getSeatMap,
    createBooking: bookings.createBooking,
    getMyBookings: bookings.getMyBookings,
    getBooking: bookings.getBooking,
    cancelBooking: bookings.cancelBooking,
    normalizeCachedBooking: bookings.normalizeCachedBooking,
  };
}
