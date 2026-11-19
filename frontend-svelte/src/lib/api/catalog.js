import { normalizeDestinations, normalizeSeatMap, normalizeTrains } from '../normalizers.js';

export function createCatalogApi(request, mock, getLastMeta) {
  let destinationCache = [];

  function getCachedDestinations() {
    return destinationCache.length ? destinationCache : mock.getDestinations();
  }

  async function getDestinations() {
    const result = await request('/destinations', {
      allowMock: true,
      mock: () => mock.getDestinations(),
      normalize: (raw) => normalizeDestinations(raw),
    });
    if (result.data.length) destinationCache = result.data;
    return result.data;
  }

  function resolveTrainQuery(filters = {}) {
    const query = { ...filters };
    const destinations = getCachedDestinations();
    const country = query.country ? String(query.country) : '';
    const selectedDestination = country
      ? destinations.find(
          (destination) =>
            destination.id === country.toLowerCase() ||
            destination.countryCode.toLowerCase() === country.toLowerCase(),
        )
      : null;

    if (selectedDestination) {
      query.country = selectedDestination.countryCode;
    }

    const stationIdForCity = (cityName) => {
      const pool = selectedDestination ? [selectedDestination] : destinations;
      for (const destination of pool) {
        const city = (destination.cities || []).find(
          (item) => item.name.toLowerCase() === String(cityName).toLowerCase(),
        );
        if (city?.stationId) return city.stationId;
      }
      return cityName;
    };

    if (query.from) query.from = stationIdForCity(query.from);
    if (query.to) query.to = stationIdForCity(query.to);
    return query;
  }

  async function getTrains(filters = {}) {
    const hasFilters = Object.values(filters).some(
      (value) => value !== undefined && value !== null && value !== '',
    );
    const endpoint = hasFilters ? '/trains/search' : '/trains';
    const result = await request(endpoint, {
      query: hasFilters ? resolveTrainQuery(filters) : undefined,
      allowMock: true,
      mock: () => mock.searchTrains(filters).trains,
      normalize: (raw) => normalizeTrains(raw, getCachedDestinations()),
    });
    return result.data;
  }

  async function getCatalog(filters = {}) {
    const destinations = await getDestinations();
    const trains = await getTrains(filters);
    return { destinations, trains, meta: getLastMeta() };
  }

  async function getTrain(trainId) {
    const result = await request(`/trains/${encodeURIComponent(trainId)}`, {
      allowMock: true,
      mock: () => mock.getTrain(trainId),
      normalize: (raw) => normalizeTrains({ trains: [raw] }, getCachedDestinations())[0] ?? null,
    });
    return result.data;
  }

  async function getSeatMap(trainId, date) {
    const result = await request(`/trains/${encodeURIComponent(trainId)}/seats`, {
      query: date ? { date } : undefined,
      allowMock: true,
      mock: () => mock.getSeatMap(trainId, date ?? new Date().toISOString().slice(0, 10)),
      normalize: (raw) => normalizeSeatMap(raw),
    });
    return result.data;
  }

  async function searchTrains(filters = {}) {
    const trains = await getTrains(filters);
    return { total: trains.length, trains };
  }

  return {
    getDestinations,
    resolveTrainQuery,
    getTrains,
    getCatalog,
    getTrain,
    getSeatMap,
    searchTrains,
    getCachedDestinations,
  };
}
