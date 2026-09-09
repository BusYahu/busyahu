import { Response } from 'express';
import { ObjectId } from 'mongodb';
import QRCode from 'qrcode';
import { getDB } from '../config/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { IBooking } from '../models/booking.model';
import { ITrain } from '../models/train.model';

// Generador de código alfanumérico único para el pasaje (ej: BY-849201)
function generateBookingCode(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `BY-${randomNum}`;
}

// 1. POST /api/bookings - Crear Reserva con Bloqueo de Asientos
export async function createBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { trainId, date, seats, passengers } = req.body;
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    if (!trainId || !date || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Faltan campos obligatorios: trainId, date y lista de seats.',
      });
      return;
    }

    const db = getDB();
    const trainsCollection = db.collection<ITrain>('trains');
    const bookingsCollection = db.collection<IBooking>('bookings');

    // 1. Buscar el tren
    let trainQuery: any = ObjectId.isValid(trainId) ? { _id: new ObjectId(trainId) } : { code: trainId };
    const train = await trainsCollection.findOne(trainQuery);

    if (!train) {
      res.status(404).json({ error: 'Not Found', message: 'El tren especificado no existe.' });
      return;
    }

    // 2. CRITERIO DE ACEPTACIÓN 1: Evitar reservas duplicadas (409 Conflict)
    const existingBookings = await bookingsCollection.find({
      trainId: train._id?.toHexString() || train.code,
      date,
      status: 'confirmed',
      seats: { $in: seats }
    }).toArray();

    if (existingBookings.length > 0) {
      const occupiedSeats: string[] = [];
      existingBookings.forEach(b => {
        b.seats.forEach(s => {
          if (seats.includes(s)) occupiedSeats.push(s);
        });
      });

      res.status(409).json({
        error: 'Conflict',
        message: `Uno o más asientos seleccionados ya están ocupados: ${occupiedSeats.join(', ')}`,
        occupiedSeats
      });
      return;
    }

    // 3. Calcular precio total
    let totalPrice = 0;
    seats.forEach((seatCode: string) => {
      const carriageNum = parseInt(seatCode.split('-')[0], 10);
      const carriage = train.carriages?.find(c => c.carriageNumber === carriageNum);
      const mult = carriage?.classType === 'First' ? 1.4 : carriage?.classType === 'Business' ? 1.8 : 1.0;
      totalPrice += Number((train.basePrice * mult).toFixed(2));
    });

    const bookingCode = generateBookingCode();

    // 4. Generar código QR en formato Base64 Data URL
    const qrPayload = JSON.stringify({
      bookingCode,
      trainCode: train.code,
      date,
      seats,
      user: userEmail,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, { width: 250, margin: 2 });

    // 5. Guardar en MongoDB
    const newBooking: IBooking = {
      bookingCode,
      userId,
      userEmail,
      trainId: train._id?.toHexString() || train.code,
      trainCode: train.code,
      trainName: train.name,
      originStationId: train.originStationId,
      destinationStationId: train.destinationStationId,
      date,
      departureTime: train.departureTime || '08:30',
      seats,
      passengers: passengers || [],
      totalPrice: Number(totalPrice.toFixed(2)),
      currency: 'EUR',
      status: 'confirmed',
      qrCodeDataUrl,
      createdAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(newBooking);
    newBooking._id = result.insertedId;

    res.status(201).json({
      message: 'Reserva confirmada con éxito.',
      booking: {
        ...newBooking,
        id: newBooking._id.toHexString(),
      }
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error interno al procesar la reserva.' });
  }
}

// 2. GET /api/bookings/my-bookings - Listado de reservas del usuario actual
export async function getMyBookings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const db = getDB();
    const bookings = await db.collection<IBooking>('bookings')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      total: bookings.length,
      bookings: bookings.map(b => ({
        ...b,
        id: b._id ? b._id.toHexString() : '',
      }))
    });
  } catch (error) {
    console.error('Error al obtener reservas del usuario:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al consultar reservas.' });
  }
}

// 3. GET /api/bookings/:id - Detalle de un billete
export async function getBookingById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = getDB();

    let query: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { bookingCode: id };
    const booking = await db.collection<IBooking>('bookings').findOne(query);

    if (!booking) {
      res.status(404).json({ error: 'Not Found', message: 'Reserva no encontrada.' });
      return;
    }

    // Permitir ver si es dueño o admin
    if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para ver esta reserva.' });
      return;
    }

    res.status(200).json({
      booking: {
        ...booking,
        id: booking._id ? booking._id.toHexString() : '',
      }
    });
  } catch (error) {
    console.error('Error al obtener billete:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al consultar el billete.' });
  }
}

// 4. DELETE /api/bookings/:id - CRITERIO 2: Cancelación y liberación inmediata de asientos
export async function cancelBooking(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = getDB();

    let query: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { bookingCode: id };
    const booking = await db.collection<IBooking>('bookings').findOne(query);

    if (!booking) {
      res.status(404).json({ error: 'Not Found', message: 'Reserva no encontrada.' });
      return;
    }

    if (booking.userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'No puedes cancelar reservas ajenas.' });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ error: 'Bad Request', message: 'Esta reserva ya se encuentra cancelada.' });
      return;
    }

    // Cambiar estado a cancelado (libera los asientos en las búsquedas)
    await db.collection<IBooking>('bookings').updateOne(
      { _id: booking._id },
      { $set: { status: 'cancelled' } }
    );

    res.status(200).json({
      message: 'Reserva cancelada con éxito. Los asientos han sido liberados.',
      bookingCode: booking.bookingCode,
      freedSeats: booking.seats,
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al cancelar la reserva.' });
  }
}