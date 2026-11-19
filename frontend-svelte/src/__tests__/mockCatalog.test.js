import { describe, expect, it } from 'vitest';
import { createMockCatalog, buildMockDestinations } from '../lib/mock/catalogMock.js';

describe('catálogo mock', () => {
  it('genera destinos con estación asignada', () => {
    const destinations = buildMockDestinations();
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations[0].cities[0].stationId).toBeTruthy();
  });

  it('busca trenes por país, origen y destino', () => {
    const catalog = createMockCatalog();
    const sample = catalog.trains[0];

    const found = catalog.searchTrains({
      country: sample.countryCode?.toLowerCase(),
      from: sample.fromCity,
      to: sample.toCity,
    });
    expect(found.total).toBeGreaterThan(0);
    expect(catalog.searchTrains({ country: 'zz' }).total).toBe(0);
  });

  it('encuentra el tren por id y por número', () => {
    const catalog = createMockCatalog();
    const sample = catalog.trains[0];

    expect(catalog.getTrain(sample.id)?.id).toBe(sample.id);
    expect(catalog.getTrain(sample.trainNumber)?.id).toBe(sample.id);
    expect(catalog.getTrain('inexistente')).toBeNull();
  });

  it('arma un mapa de asientos con ocupación', () => {
    const catalog = createMockCatalog();
    const map = catalog.getSeatMap(catalog.trains[0].id, '2026-09-20');

    expect(map.totalCarriages).toBe(3);
    expect(map.carriages[0].classType).toBe('First');
    expect(map.carriages[0].seats.some((seat) => seat.status === 'ocupado')).toBe(true);
  });
});
