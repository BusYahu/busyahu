import { describe, expect, it } from 'vitest';
import { createMockCatalog } from '../lib/mock/catalogMock';

describe('catálogo mock', () => {
  it('genera destinos con estación asignada', () => {
    const catalog = createMockCatalog();
    expect(catalog.destinations.length).toBeGreaterThan(0);
    expect(catalog.destinations[0].cities[0].stationId).toBeTruthy();
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
    expect(found.trains[0].fromCity).toBe(sample.fromCity);

    expect(catalog.searchTrains({ country: 'zz' }).total).toBe(0);
  });

  it('encuentra el tren por id y por número', () => {
    const catalog = createMockCatalog();
    const sample = catalog.trains[0];

    expect(catalog.getTrain(sample.id)?.id).toBe(sample.id);
    expect(catalog.getTrain(sample.trainNumber)?.id).toBe(sample.id);
    expect(catalog.getTrain('inexistente')).toBeNull();
  });

  it('arma un mapa de asientos con clases y ocupación', () => {
    const catalog = createMockCatalog();
    const map = catalog.getSeatMap(catalog.trains[0].id, '2026-09-20') as {
      date: string;
      totalCarriages: number;
      carriages: { classType: string; seats: { status: string; price: number }[] }[];
    };

    expect(map.date).toBe('2026-09-20');
    expect(map.totalCarriages).toBe(3);
    expect(map.carriages[0].classType).toBe('First');
    expect(map.carriages[1].classType).toBe('Standard');
    expect(map.carriages[0].seats.some((seat) => seat.status === 'ocupado')).toBe(true);
    expect(map.carriages[0].seats[0].price).toBeGreaterThan(0);
  });

  it('cae al primer tren cuando el id no existe', () => {
    const catalog = createMockCatalog();
    const map = catalog.getSeatMap('NO-EXISTE', '2026-01-01') as { trainId: string };
    expect(map.trainId).toBe(catalog.trains[0].id);
  });
});
