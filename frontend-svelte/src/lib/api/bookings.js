import { canonicalSeatClass, normalizeBooking, normalizeBookings } from '../normalizers.js';
import { readCachedBookings, saveCachedBookings } from '../storage.js';

export function createBookingApi(request, mock, getCachedDestinations) {
  async function createBooking(payload) {
    const trainId = payload.trainId ?? payload.train?.id ?? '';
    const passengers = (payload.passengers ?? []).map((passenger) => ({
      ...passenger,
      seatClass: canonicalSeatClass(passenger.seatClass),
    }));
    const body = {
      trainId,
      travelDate: payload.travelDate,
      passengers,
      totalPrice: Number(payload.totalPrice ?? 0),
      currency: payload.currency ?? payload.train?.currency ?? 'EUR',
      userEmail: payload.userEmail ?? '',
      seats: passengers.map((passenger) => passenger.seatId),
    };
    const result = await request('/bookings', {
      method: 'POST',
      body,
      allowMock: true,
      mock: () =>
        mock.createBooking({ ...body, train: payload.train ?? mock.getTrain(trainId) }),
      normalize: (raw) => normalizeBooking(raw, getCachedDestinations(), payload.train ?? null),
    });
    const backend = result.meta.source === 'mock' ? 'mock' : result.meta.backend;
    const booking = { ...result.data, backend };
    const cached = readCachedBookings();
    const withoutDuplicates = cached.filter(
      (item) => item.id !== booking.id && item.bookingCode !== booking.bookingCode,
    );
    saveCachedBookings([booking, ...withoutDuplicates]);
    return booking;
  }

  async function getMyBookings() {
    const result = await request('/bookings/my-bookings', {
      allowMock: true,
      mock: () => mock.getMyBookings(),
      normalize: (raw) => normalizeBookings(raw, getCachedDestinations()),
    });
    return result.data;
  }

  async function getBooking(bookingId) {
    const result = await request(`/bookings/${encodeURIComponent(bookingId)}`, {
      allowMock: true,
      mock: () => mock.getBooking(bookingId),
      normalize: (raw) => normalizeBooking(raw, getCachedDestinations()),
    });
    return result.data;
  }

  async function cancelBooking(bookingId) {
    const cached = mock.getBooking(bookingId);
    const result = await request(`/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      allowMock: true,
      mock: () => mock.cancelBooking(bookingId),
      normalize: (raw) => {
        const payload = raw && Object.keys(raw).length ? raw : {};
        return normalizeBooking(
          { ...(cached ?? {}), ...payload, status: payload.status ?? 'cancelled' },
          getCachedDestinations(),
          cached?.train ?? null,
        );
      },
    });
    if (result.data) {
      const stored = readCachedBookings();
      saveCachedBookings(
        stored.map((booking) =>
          booking.id === result.data?.id || booking.bookingCode === result.data?.bookingCode
            ? { ...booking, status: 'cancelled' }
            : booking,
        ),
      );
    }
    return result.data;
  }

  async function generateQr(payload) {
    const result = await request('/bookings/qr', {
      method: 'POST',
      body: { data: payload },
      allowMock: true,
      mock: () => ({
        success: false,
        qrCode: '',
        message: 'Generación de QR no disponible sin backend.',
      }),
      normalize: (raw) => raw ?? {},
    });
    return {
      success: Boolean(result.data.success ?? Boolean(result.data.qrCode)),
      qrCode: String(result.data.qrCode ?? ''),
      message: result.data.message ? String(result.data.message) : undefined,
    };
  }

  async function sendTicketEmail(payload) {
    const result = await request('/bookings/send-direct-email', {
      method: 'POST',
      body: payload,
      normalize: (raw) => raw ?? {},
    });
    return result.data;
  }

  async function generateWallet(payload) {
    const result = await request('/bookings/generate-wallet', {
      method: 'POST',
      body: payload,
      normalize: (raw) => raw ?? {},
    });
    return result.data;
  }

  return {
    createBooking,
    getMyBookings,
    getBooking,
    cancelBooking,
    generateQr,
    sendTicketEmail,
    generateWallet,
  };
}
