// API Service - Compatible with both Express (port 4000) and FastAPI (port 8000)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('busyahu_token');
  }

  setToken(token) {
    localStorage.setItem('busyahu_token', token);
  }

  clearToken() {
    localStorage.removeItem('busyahu_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(name, email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getProfile() {
    return this.request('/api/auth/me');
  }

  // Destinations
  async getDestinations() {
    return this.request('/api/destinations');
  }

  // Trains search
  async searchTrains(params = {}) {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.country) query.set('country', params.country);
    if (params.date) query.set('date', params.date);

    const queryString = query.toString();
    return this.request(`/api/trains/search${queryString ? '?' + queryString : ''}`);
  }

  // Train detail
  async getTrain(trainId) {
    return this.request(`/api/trains/${trainId}`);
  }

  // Seat map
  async getSeatMap(trainId, date) {
    const query = date ? `?date=${date}` : '';
    return this.request(`/api/trains/${trainId}/seats${query}`);
  }

  // Bookings
  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getMyBookings() {
    return this.request('/api/bookings/my-bookings');
  }

  async getBooking(bookingId) {
    return this.request(`/api/bookings/${bookingId}`);
  }

  async cancelBooking(bookingId) {
    return this.request(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
