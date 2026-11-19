import { createMockBookings } from './mock/bookingsMock.js';
import { buildMockDestinations, buildMockTrains, createMockCatalog } from './mock/catalogMock.js';

export { buildMockDestinations, buildMockTrains };

/**
 * Fachada del adaptador mock: compone los dobles por dominio (catálogo y
 * reservas) manteniendo la interfaz histórica que consumen los servicios.
 */
export function createMockAdapter() {
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
