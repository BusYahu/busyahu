import { describe, expect, it } from 'vitest';
import { createMockCatalog } from '../lib/mock/catalogMock.js';
import { filterTrains, readInitialSearchState } from '../lib/searchFilters';

describe('filtros de búsqueda', () => {
  const catalog = createMockCatalog();
  const destination = catalog.destinations[0];
  const train = catalog.trains.find((item) => item.country === destination.country) ?? catalog.trains[0];

  it('filtra por país, origen y destino', () => {
    const result = filterTrains(
      catalog.trains,
      destination,
      train.fromCity,
      train.toCity,
      'all',
      'price_asc',
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.country === destination.country)).toBe(true);
  });

  it('ordena por precio y por hora de salida', () => {
    const byPrice = filterTrains(catalog.trains, undefined, '', '', 'all', 'price_asc');
    expect(byPrice[0].basePrice).toBeLessThanOrEqual(byPrice[byPrice.length - 1].basePrice);

    const byDeparture = filterTrains(catalog.trains, undefined, '', '', 'all', 'departure_asc');
    expect(byDeparture[0].departureTime <= byDeparture[byDeparture.length - 1].departureTime).toBe(
      true,
    );
  });

  it('aplica filtros horarios', () => {
    const morning = filterTrains(catalog.trains, undefined, '', '', 'morning', 'price_asc');
    expect(morning.every((item) => Number(item.departureTime.split(':')[0]) < 12)).toBe(true);

    const evening = filterTrains(catalog.trains, undefined, '', '', 'evening', 'price_asc');
    expect(
      evening.every((item) => {
        const hour = Number(item.departureTime.split(':')[0]);
        return hour >= 18 || hour < 6;
      }),
    ).toBe(true);
  });

  it('devuelve un estado inicial por defecto sin almacenamiento', () => {
    expect(readInitialSearchState()).toMatchObject({
      selectedCountryId: 'es',
      fromCity: 'Madrid',
      toCity: 'Barcelona',
      passengerCount: 1,
      selectedClassTier: 'tourist',
    });
  });
});
