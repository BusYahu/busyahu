import { writable, derived } from 'svelte/store';
import { api } from './api.js';

// Auth store
function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    token: localStorage.getItem('busyahu_token'),
    loading: false,
    error: null,
  });

  return {
    subscribe,
    login: async (email, password) => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.login(email, password);
        set({ user: data.user, token: data.token, loading: false, error: null });
        return data;
      } catch (err) {
        update(s => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    register: async (name, email, password) => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        await api.register(name, email, password);
        // Auto-login after registration
        const data = await api.login(email, password);
        set({ user: data.user, token: data.token, loading: false, error: null });
        return data;
      } catch (err) {
        update(s => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    logout: () => {
      api.clearToken();
      set({ user: null, token: null, loading: false, error: null });
    },
    checkAuth: async () => {
      const token = localStorage.getItem('busyahu_token');
      if (!token) {
        set({ user: null, token: null, loading: false, error: null });
        return;
      }
      update(s => ({ ...s, loading: true }));
      try {
        const user = await api.getProfile();
        set({ user, token, loading: false, error: null });
      } catch {
        api.clearToken();
        set({ user: null, token: null, loading: false, error: null });
      }
    },
    clearError: () => update(s => ({ ...s, error: null })),
  };
}

export const auth = createAuthStore();

// Destinations store
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
        // Handle both formats: array directly or object with destinations property
        const destinationsList = Array.isArray(data) ? data : (data.destinations || []);
        set({ destinations: destinationsList, loading: false, error: null });
      } catch (err) {
        set({ destinations: [], loading: false, error: err.message });
      }
    },
  };
}

export const destinations = createDestinationsStore();

// Search store
function createSearchStore() {
  const { subscribe, set, update } = writable({
    results: [],
    total: 0,
    loading: false,
    error: null,
    filters: {
      country: '',
      from: '',
      to: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  return {
    subscribe,
    setFilters: (newFilters) => {
      update(s => ({ ...s, filters: { ...s.filters, ...newFilters } }));
    },
    search: async (filters) => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.searchTrains(filters);
        console.log('[SearchStore] API response:', data);
        console.log('[SearchStore] Filters sent:', filters);
        set({
          results: data.trains || [],
          total: data.total || 0,
          loading: false,
          error: null,
          filters,
        });
      } catch (err) {
        console.error('[SearchStore] API error:', err);
        update(s => ({ ...s, loading: false, error: err.message }));
      }
    },
    clear: () => set({
      results: [],
      total: 0,
      loading: false,
      error: null,
      filters: {
        country: '',
        from: '',
        to: '',
        date: new Date().toISOString().split('T')[0],
      },
    }),
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
      update(s => ({ ...s, loading: true, error: null, selectedSeats: [] }));
      try {
        const data = await api.getSeatMap(trainId, date);
        set({ seatMap: data, selectedSeats: [], loading: false, error: null });
      } catch (err) {
        update(s => ({ ...s, loading: false, error: err.message }));
      }
    },
    toggleSeat: (seat) => {
      update(s => {
        const exists = s.selectedSeats.find(sa => sa.seatNumber === seat.seatNumber);
        if (exists) {
          return { ...s, selectedSeats: s.selectedSeats.filter(sa => sa.seatNumber !== seat.seatNumber) };
        }
        return { ...s, selectedSeats: [...s.selectedSeats, seat] };
      });
    },
    clearSelection: () => update(s => ({ ...s, selectedSeats: [] })),
    clear: () => set({ seatMap: null, selectedSeats: [], loading: false, error: null }),
  };
}

export const seatStore = createSeatStore();

// Bookings store
function createBookingsStore() {
  const { subscribe, set, update } = writable({
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,
    loadMyBookings: async () => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.getMyBookings();
        set({ bookings: data || [], loading: false, error: null, currentBooking: null });
      } catch (err) {
        update(s => ({ ...s, loading: false, error: err.message }));
      }
    },
    loadBooking: async (bookingId) => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await api.getBooking(bookingId);
        set({ ...[], currentBooking: data, loading: false, error: null });
        return data;
      } catch (err) {
        update(s => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
    cancelBooking: async (bookingId) => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        await api.cancelBooking(bookingId);
        update(s => ({
          ...s,
          bookings: s.bookings.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
          loading: false,
          error: null,
        }));
      } catch (err) {
        update(s => ({ ...s, loading: false, error: err.message }));
        throw err;
      }
    },
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
