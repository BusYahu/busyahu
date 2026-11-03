import { Response } from 'express';
import { ObjectId } from 'mongodb';
import QRCode from 'qrcode';
import { getDB } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ITrain } from '../models/train.model';
import {
  IBooking,
  IBookingPassenger,
  IBookingTrainSummary,
} from '../models/booking.model';

function canonicalSeatClass(value: unknown): 'Standard' | 'First' | 'Business' {
  const normalized = String(value ?? 'Standard').toLowerCase();
  if (normalized === 'first') return 'First';
  if (normalized === 'business') return 'Business';
  return 'Standard';
}

function trainSummary(train: Partial<ITrain> & { _id?: ObjectId }): IBookingTrainSummary {
  return {
    id: train._id ? train._id.toHexString() : String(train.code ?? ''),
    code: String(train.code ?? ''),
    countryCode: String(train.countryCode ?? ''),
    name: String(train.name ?? ''),
    type: String(train.type ?? ''),
    originStationId: String(train.originStationId ?? ''),
    destinationStationId: String(train.destinationStationId ?? ''),
    departureTime: String(train.departureTime ?? '08:30'),
    arrivalTime: String(train.arrivalTime ?? '11:45'),
    duration: String(train.duration ?? '3h 15m'),
    basePrice: Number(train.basePrice ?? 0),
  };
}

function readingBody(body: any) {
  return {
    trainId: body?.trainId ?? body?.train_id ?? body?.train?.id ?? '',
    travelDate: body?.travelDate ?? body?.travel_date ?? body?.date ?? '',
    currency: body?.currency ?? 'EUR',
    totalPrice: Number(body?.totalPrice ?? body?.total_price ?? 0),
    passengers: body?.passengers,
    seats: body?.seats,
  };
}

function normalizePassengers(rawPassengers: unknown): IBookingPassenger[] {
  if (!Array.isArray(rawPassengers)) return [];
  return rawPassengers.map((item) => {
    const passenger = (item ?? {}) as Record<string, unknown>;
    return {
      fullName: String(passenger.fullName ?? passenger.full_name ?? passenger.name ?? ''),
      passportId: String(
        passenger.passportId ?? passenger.passport_id ?? passenger.documentId ?? '',
      ),
      seatId: String(passenger.seatId ?? passenger.seat_id ?? passenger.seat ?? ''),
      seatClass: canonicalSeatClass(passenger.seatClass ?? passenger.seat_class),
      price: Number(passenger.price ?? 0),
    };
  });
}

function bookingToResponse(doc: IBooking & { _id?: ObjectId }) {
  return {
    id: doc._id ? doc._id.toHexString() : String(doc.bookingCode ?? ''),
    bookingCode: doc.bookingCode,
    train: doc.train,
    trainId: doc.trainId,
    travelDate: doc.travelDate ?? doc.date,
    date: doc.date ?? doc.travelDate,
    seats: doc.seats,
    passengers: doc.passengers,
    totalPrice: doc.totalPrice,
    currency: doc.currency,
    createdAt: doc.createdAt,
    status: doc.status,
    qrPayload: doc.qrPayload,
    qrCode: doc.qrCode,
    userEmail: doc.userEmail,
  };
}

async function findTrain(value: string) {
  const db = getDB();
  if (ObjectId.isValid(value)) {
    const byId = await db.collection<ITrain>('trains').findOne({ _id: new ObjectId(value) });
    if (byId) return byId;
  }
  return db.collection<ITrain>('trains').findOne({ code: value });
}

async function findBooking(value: string) {
  const db = getDB();
  if (ObjectId.isValid(value)) {
    const byId = await db.collection<IBooking>('bookings').findOne({ _id: new ObjectId(value) });
    if (byId) return byId;
  }
  return db.collection<IBooking>('bookings').findOne({ bookingCode: value });
}

function isOwner(
  booking: IBooking,
  user: NonNullable<AuthRequest['user']>,
): boolean {
  return (
    booking.userEmail === user.email ||
    booking.userId === user.id ||
    user.role === 'admin'
  );
}

// POST /api/bookings - emisión de billetes con el mismo contrato que FastAPI.
export async function createBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = readingBody(req.body);
    const passengers = normalizePassengers(body.passengers);

    if (!body.trainId) {
      res.status(400).json({
        error: 'Bad Request',
        detail: "Debe proporcionar 'trainId' o el objeto 'train'.",
        message: "Debe proporcionar 'trainId' o el objeto 'train'.",
      });
      return;
    }
    if (!body.travelDate || !passengers.length) {
      res.status(400).json({
        error: 'Bad Request',
        detail: 'Faltan travelDate o passengers en la reserva.',
        message: 'Faltan travelDate o passengers en la reserva.',
      });
      return;
    }

    const train = await findTrain(String(body.trainId));
    if (!train) {
      res.status(404).json({
        error: 'Not Found',
        detail: `Tren con ID '${body.trainId}' no encontrado en la base de datos.`,
        message: `Tren con ID '${body.trainId}' no encontrado en la base de datos.`,
      });
      return;
    }

    const trainId = train._id ? train._id.toHexString() : String(train.code ?? '');
    const seatCodes = Array.isArray(body.seats) && body.seats.length
      ? body.seats.map(String)
      : passengers.map((passenger) => passenger.seatId);

    const db = getDB();
    const bookingsCollection = db.collection<IBooking>('bookings');

    const collision = await bookingsCollection.findOne({
      trainId,
      date: body.travelDate,
      status: 'confirmed',
      seats: { $in: seatCodes },
    });
    if (collision) {
      res.status(400).json({
        error: 'Bad Request',
        detail:
          'Uno o más asientos seleccionados ya han sido reservados para esta fecha. Por favor seleccione otros asientos.',
        message:
          'Uno o más asientos seleccionados ya han sido reservados para esta fecha. Por favor seleccione otros asientos.',
      });
      return;
    }

    const countryCode = String(train.countryCode ?? 'RW').substring(0, 2).toUpperCase();
    const bookingCode = `RW-${countryCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    const firstName = (passengers[0]?.fullName ?? 'VIAJERO').toUpperCase().replace(/\s+/g, '_');
    const qrPayload = `RAILWORLD-VERIFIED:${bookingCode}:${train.code ?? ''}:${firstName}`;
    const qrCode = await QRCode.toDataURL(qrPayload);

    const now = new Date();
    const createdAt = now.toISOString().replace('T', ' ').substring(0, 16);

    const booking: IBooking = {
      bookingCode,
      train: trainSummary(train),
      trainId,
      date: body.travelDate,
      travelDate: body.travelDate,
      seats: seatCodes,
      passengers,
      totalPrice: body.totalPrice,
      currency: String((train as ITrain & { currency?: string }).currency ?? body.currency ?? 'EUR'),
      createdAt,
      status: 'confirmed',
      qrPayload,
      qrCode,
      userEmail: req.user!.email,
      userId: req.user!.id,
    };

    const result = await bookingsCollection.insertOne(booking);
    const stored = { ...booking, _id: result.insertedId };
    res.status(201).json(bookingToResponse(stored));
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al crear la reserva.',
    });
  }
}

// GET /api/bookings/my-bookings - historial del usuario autenticado.
export async function getMyBookings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const db = getDB();
    const bookings = await db.collection<IBooking>('bookings')
      .find({
        $or: [{ userEmail: req.user!.email }, { userId: req.user!.id }],
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(bookings.map((booking) => bookingToResponse(booking)));
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al consultar las reservas.',
    });
  }
}

// GET /api/bookings/:id - detalle por ObjectId o localizador.
export async function getBookingById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const booking = await findBooking(req.params.id);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        detail: `Reserva con ID o localizador '${req.params.id}' no encontrada.`,
        message: `Reserva con ID o localizador '${req.params.id}' no encontrada.`,
      });
      return;
    }
    if (!isOwner(booking, req.user!)) {
      res.status(403).json({
        error: 'Forbidden',
        detail: 'No tiene autorización para visualizar esta reserva.',
        message: 'No tiene autorización para visualizar esta reserva.',
      });
      return;
    }
    res.status(200).json(bookingToResponse(booking));
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al consultar la reserva.',
    });
  }
}

// DELETE /api/bookings/:id - cancelación y liberación inmediata de asientos.
export async function cancelBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const booking = await findBooking(req.params.id);
    if (!booking) {
      res.status(404).json({
        error: 'Not Found',
        detail: `Reserva con ID '${req.params.id}' no encontrada.`,
        message: `Reserva con ID '${req.params.id}' no encontrada.`,
      });
      return;
    }
    if (!isOwner(booking, req.user!)) {
      res.status(403).json({
        error: 'Forbidden',
        detail: 'No tiene autorización para cancelar esta reserva.',
        message: 'No tiene autorización para cancelar esta reserva.',
      });
      return;
    }

    const id = booking._id ? booking._id.toHexString() : String(booking.bookingCode ?? '');
    if (booking.status === 'cancelled') {
      res.status(200).json({
        message: 'La reserva ya se encontraba cancelada previamente.',
        id,
        status: 'cancelled',
      });
      return;
    }

    const cancelledAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    await getDB().collection<IBooking>('bookings').updateOne(
      { _id: booking._id },
      { $set: { status: 'cancelled', cancelledAt } },
    );

    res.status(200).json({
      message: 'Reserva cancelada exitosamente. Los asientos han sido liberados inmediatamente.',
      id,
      status: 'cancelled',
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al cancelar la reserva.',
    });
  }
}

// POST /api/bookings/qr - genera un QR base64 para cualquier payload.
export async function generateBookingQr(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = String(
      body.data ??
        body.payload ??
        body.qrPayload ??
        body.qr_payload ??
        body.bookingCode ??
        body.booking_code ??
        'BUSYAHU-RAIL',
    );
    const qrCode = await QRCode.toDataURL(data);
    res.status(200).json({ success: true, qrCode });
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Error al generar el código QR.',
    });
  }
}
