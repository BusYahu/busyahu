import { useCallback, useEffect, useMemo, useState } from 'react';
import { INITIAL_DESTINATIONS, INITIAL_TRAIN_ROUTES } from '../mockData';
import type { Destination, TrainRoute } from '../types';
import { apiGateway } from '../lib/apiClient';
import { readSearchFilters, saveSearchFilters } from '../lib/storage';

export function useTravelCatalog() {
  const initialFilters = useMemo(() => readSearchFilters(), []);

  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [trains, setTrains] = useState<TrainRoute[]>(INITIAL_TRAIN_ROUTES);
  const [selectedCountryId, setSelectedCountryId] = useState<string>(
    initialFilters.countryId || INITIAL_DESTINATIONS[0]?.id || 'es',
  );
  const [fromCity, setFromCity] = useState<string>(initialFilters.fromCity || 'Madrid');
  const [toCity, setToCity] = useState<string>(initialFilters.toCity || 'Barcelona');
  const [travelDate, setTravelDate] = useState<string>(
    initialFilters.travelDate || new Date().toISOString().slice(0, 10),
  );
  const [passengerCount, setPassengerCount] = useState<number>(initialFilters.passengerCount || 1);
  const [selectedClass, setSelectedClass] = useState<'tourist' | 'first' | 'business'>(
    initialFilters.selectedClass || 'tourist',
  );
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [nextDestinations, nextTrains] = await Promise.all([
        apiGateway.getDestinations(),
        apiGateway.getTrains(),
      ]);
      if (nextDestinations.length) setDestinations(nextDestinations);
      if (nextTrains.length) setTrains(nextTrains);
    } catch {
      // El gateway ya cae a mock; este catch evita romper la interfaz.
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    saveSearchFilters({
      countryId: selectedCountryId,
      fromCity,
      toCity,
      travelDate,
      passengerCount,
      selectedClass,
    });
  }, [selectedCountryId, fromCity, toCity, travelDate, passengerCount, selectedClass]);

  const currentDestination =
    destinations.find((destination) => destination.id === selectedCountryId) || destinations[0];
  const currentDestinationCities = currentDestination?.cities ?? [];

  useEffect(() => {
    if (!currentDestinationCities.length) return;
    if (!currentDestinationCities.some((city) => city.name === fromCity)) {
      setFromCity(currentDestinationCities[0].name);
    }
    if (!currentDestinationCities.some((city) => city.name === toCity)) {
      setToCity(currentDestinationCities[1]?.name || currentDestinationCities[0].name);
    }
  }, [currentDestination?.id, currentDestinationCities, fromCity, toCity]);

  const currentCountryTrains = useMemo(() => {
    if (!currentDestination) return [];
    return trains.filter((train) => {
      const sameCountry = train.country.toLowerCase() === currentDestination.country.toLowerCase();
      const sameOrigin = fromCity ? train.fromCity.toLowerCase() === fromCity.toLowerCase() : true;
      const sameDestination = toCity ? train.toCity.toLowerCase() === toCity.toLowerCase() : true;
      return sameCountry && sameOrigin && sameDestination;
    });
  }, [trains, currentDestination, fromCity, toCity]);

  const addTrain = useCallback((newTrain: TrainRoute) => {
    setTrains((prev) => [newTrain, ...prev]);
  }, []);

  const updateTrain = useCallback((updatedTrain: TrainRoute) => {
    setTrains((prev) => prev.map((train) => (train.id === updatedTrain.id ? updatedTrain : train)));
  }, []);

  const deleteTrain = useCallback((trainId: string) => {
    setTrains((prev) => prev.filter((train) => train.id !== trainId));
  }, []);

  return {
    destinations,
    trains,
    selectedCountryId,
    setSelectedCountryId,
    fromCity,
    setFromCity,
    toCity,
    setToCity,
    travelDate,
    setTravelDate,
    passengerCount,
    setPassengerCount,
    selectedClass,
    currentDestination,
    currentCountryTrains,
    loadingCatalog,
    loadCatalog,
    addTrain,
    updateTrain,
    deleteTrain,
  };
}
