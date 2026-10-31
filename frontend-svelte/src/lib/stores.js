import { writable } from 'svelte/store';
import { api } from './api.js';
import {
  clearSession,
  getToken,
  normalizeUser,
  readCachedBookings,
  readSearchFilters,
  readSession,
  saveCachedBookings,
  saveSearchFilters,
  saveSession,
} from './storage.js';

function defaultFilters() {
  const stored = readSearchFilters();
  return {
    country: stored.countryId || '',
    from: stored.fromCity || '',
    to: stored.toCity || '',
    date: stored.travelDate || new Date().toISOString().split('T')[0],
  };
}

// Auth store — misma sesión compartida que React (busyahu_token / busyahu_user).
function createAuthStore() {
  const initialSession = readSession();
  const { subscribe, set, update } = writable({
    user: initialSession.user,
    token: initialSession.token ?? getToken(),
    loading: false,
    error: null,
  });

  return {
    subscribe,
    login: async (email, password) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.login(email, password);
        set({ user: data.user, token: data.token, loading: false, error: null });
        return data;
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    register: async (name, email, password) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.register({ name, email, password });
        if (data.token) {
          saveSession(data.user, data.token);
        }
        set({ user: data.user, token: data.token, loading: false, error: null });
        return data;
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    logout: () => {
      clearSession();
      set({ user: null, token: null, loading: false, error: null });
    },
    checkAuth: async () => {
      const session = readSession();
      if (!session.token) {
        set({ user: null, token: null, loading: false, error: null });
        return;
      }
      update((s) => ({ ...s, loading: true }));
      try {
        const user = await api.getProfile();
        saveSession(user, session.token);
        set({ user, token: session.token, loading: false, error: null });
      } catch {
        clearSession();
        set({ user: null, token: null, loading: false, error: null });
      }
    },
    syncFromStorage: () => {
      const session = readSession();
      set({ user: session.user, token: session.token, loading: false, error: null });
    },
    clearError: () => update((s) => ({ ...s, error: null })),
  };
}

export const auth = createAuthStore();

// Destinations store — catálogo normalizado desde Express o FastAPI.
function createDestinationsStore() {
  const { subscribe, set } = writable({
    destinations: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,
    load: async () => {
      set({ destinations: [], loading: true, error: null });
      try {
        const data = await api.getDestinations();
        set({ destinations: data, loading: false, error: null });
      } catch (err) {
        set({ destinations: [], loading: false, error: err.message });
      }
    },
  };
}

export const destinations = createDestinationsStore();

// Search store — filtros persistentes y resultados normalizados.
function createSearchStore() {
  const initialFilters = defaultFilters();
  const { subscribe, set, update } = writable({
    results: [],
    total: 0,
    loading: false,
    error: null,
    filters: initialFilters,
  });

  return {
    subscribe,
    setFilters: (newFilters) => {
      update((s) => {
        const filters = { ...s.filters, ...newFilters };
        saveSearchFilters({
          countryId: filters.country,
          fromCity: filters.from,
          toCity: filters.to,
          travelDate: filters.date,
        });
        return { ...s, filters };
      });
    },
    search: async (filters) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.searchTrains(filters);
        saveSearchFilters({
          countryId: filters.country,
          fromCity: filters.from,
          toCity: filters.to,
          travelDate: filters.date,
        });
        set({
          results: data.trains || [],
          total: data.total || 0,
          loading: false,
          error: null,
          filters,
        });
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
      }
    },
    clear: () => set({ results: [], total: 0, loading: false, error: null, filters: defaultFilters() }),
  };
}

export const search = createSearchStore();

// Seat selection store
function createSeatStore() {
  const { subscribe, set, update } = writable({
    seatMap: null,
    selectedSeats: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,
    loadSeatMap: async (trainId, date) => {
      update((s) => ({ ...s, loading: true, error: null, selectedSeats: [] }));
      try {
        const data = await api.getSeatMap(trainId, date);
        set({ seatMap: data, selectedSeats: [], loading: false, error: null });
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
      }
    },
    toggleSeat: (seat) => {
      update((s) => {
        const exists = s.selectedSeats.find((sa) => sa.seatNumber === seat.seatNumber);
        if (exists) {
          return { ...s, selectedSeats: s.selectedSeats.filter((sa) => sa.seatNumber !== seat.seatNumber) };
        }
        return { ...s, selectedSeats: [...s.selectedSeats, seat] };
      });
    },
    clearSelection: () => update((s) => ({ ...s, selectedSeats: [] })),
    clear: () => set({ seatMap: null, selectedSeats: [], loading: false, error: null }),
  };
}

export const seatStore = createSeatStore();

// Bookings store — caché compartida busyahu_bookings.
function createBookingsStore() {
  const { subscribe, set, update } = writable({
    bookings: readCachedBookings(),
    currentBooking: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,
    loadMyBookings: async () => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.getMyBookings();
        saveCachedBookings(data || []);
        set({ bookings: data || [], loading: false, error: null, currentBooking: null });
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
      }
    },
    loadBooking: async (bookingId) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.getBooking(bookingId);
        set({ bookings: readCachedBookings(), currentBooking: data, loading: false, error: null });
        return data;
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    cancelBooking: async (bookingId) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        await api.cancelBooking(bookingId);
        update((s) => ({
          ...s,
          bookings: s.bookings.map((b) =>
            b.id === bookingId || b.bookingCode === bookingId ? { ...b, status: 'cancelled' } : b,
          ),
          loading: false,
          error: null,
        }));
      } catch (err) {
        update((s) => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    syncFromStorage: () => update((s) => ({ ...s, bookings: readCachedBookings() })),
    clear: () => set({ bookings: [], currentBooking: null, loading: false, error: null }),
  };
}

export const bookings = createBookingsStore();

// Navigation store
function createNavStore() {
  const { subscribe, set } = writable({
    currentView: 'search',
    params: null,
  });

  return {
    subscribe,
    navigate: (view, params = null) => set({ currentView: view, params }),
  };
}

export const nav = createNavStore();

// Modal store for auth
function createModalStore() {
  const { subscribe, set } = writable({
    authModal: false,
  });

  return {
    subscribe,
    openAuth: () => set({ authModal: true }),
    closeAuth: () => set({ authModal: false }),
  };
}

export const modal = createModalStore();

export { normalizeUser };
