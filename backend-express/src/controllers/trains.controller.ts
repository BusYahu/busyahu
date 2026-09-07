import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db';
import { IDestination, ITrain, ICarriageSeatsResponse, ISeatStatus } from '../models/train.model';

// 1. GET /api/destinations - Catálogo de los 11 países y sus estaciones
export async function getDestinations(req: Request, res: Response): Promise<void> {
  try {
    const db = getDB();
    const destinations = await db.collection<IDestination>('destinations')
      .find({})
      .sort({ countryName: 1 })
      .toArray();

    res.status(200).json({
      total: destinations.length,
      destinations: destinations.map(d => ({
        id: d._id ? d._id.toHexString() : '',
        countryCode: d.countryCode,
        countryName: d.countryName,
        networkName: d.networkName,
        currency: d.currency,
        symbol: d.symbol,
        stations: d.stations
      }))
    });
  } catch (error) {
    console.error('Error al obtener destinos:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al consultar destinos.' });
  }
}

// 2. GET /api/trains/search?from=...&to=...&date=...&country=... - Búsqueda de trayectos
export async function searchTrains(req: Request, res: Response): Promise<void> {
  try {
    const { from, to, country, date } = req.query;
    const db = getDB();

    const queryFilter: any = {};

    if (country) {
      queryFilter.countryCode = (country as string).toUpperCase();
    }
    if (from) {
      queryFilter.originStationId = from as string;
    }
    if (to) {
      queryFilter.destinationStationId = to as string;
    }

    // Criterio de Aceptación 1: Búsqueda ordenada por horario de salida y precio base
    const trains = await db.collection<ITrain>('trains')
      .find(queryFilter)
      .sort({ departureTime: 1, basePrice: 1 })
      .toArray();

    // Mapeo seguro para enviar al cliente
    const results = trains.map(train => ({
      id: train._id ? train._id.toHexString() : '',
      code: train.code,
      countryCode: train.countryCode,
      name: train.name,
      type: train.type,
      originStationId: train.originStationId,
      destinationStationId: train.destinationStationId,
      departureTime: train.departureTime || '08:30',
      arrivalTime: train.arrivalTime || '11:45',
      duration: train.duration || '3h 15m',
      basePrice: train.basePrice,
      date: date || new Date().toISOString().split('T')[0],
      carriagesCount: train.carriages ? train.carriages.length : 0
    }));

    res.status(200).json({
      total: results.length,
      trains: results
    });
  } catch (error) {
    console.error('Error en búsqueda de trenes:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al buscar trenes.' });
  }
}

// 3. GET /api/trains/:id - Detalle completo de un tren
export async function getTrainById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = getDB();

    let query: any;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { code: id }; // Permite buscar por código como 'AVE-103'
    }

    const train = await db.collection<ITrain>('trains').findOne(query);

    if (!train) {
      res.status(404).json({ error: 'Not Found', message: 'Tren no encontrado.' });
      return;
    }

    res.status(200).json({
      id: train._id ? train._id.toHexString() : '',
      code: train.code,
      countryCode: train.countryCode,
      name: train.name,
      type: train.type,
      originStationId: train.originStationId,
      destinationStationId: train.destinationStationId,
      departureTime: train.departureTime || '08:30',
      arrivalTime: train.arrivalTime || '11:45',
      duration: train.duration || '3h 15m',
      basePrice: train.basePrice,
      carriages: train.carriages
    });
  } catch (error) {
    console.error('Error al obtener tren:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al consultar el tren.' });
  }
}

// 4. GET /api/trains/:id/seats - Mapa interactivo de asientos por vagón
export async function getTrainSeats(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { date } = req.query;
    const db = getDB();

    let query: any;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { code: id };
    }

    const train = await db.collection<ITrain>('trains').findOne(query);

    if (!train) {
      res.status(404).json({ error: 'Not Found', message: 'Tren no encontrado.' });
      return;
    }

    // Consultar asientos ya reservados en la colección bookings si existen
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    const bookings = await db.collection('bookings')
      .find({ trainId: train._id?.toHexString() || train.code, date: targetDate, status: { $ne: 'cancelled' } })
      .toArray();

    // Conjunto de asientos reservados
    const reservedSeatsSet = new Set<string>();
    bookings.forEach((b: any) => {
      if (Array.isArray(b.seats)) {
        b.seats.forEach((s: string) => reservedSeatsSet.add(s));
      }
    });

    const columns = ['A', 'B', 'C', 'D', 'E'];

    // Criterio de Aceptación 2: Generar la matriz completa de vagones con estado ('libre' | 'ocupado')
    const carriagesResponse: ICarriageSeatsResponse[] = train.carriages.map(carriage => {
      const seats: ISeatStatus[] = [];
      const multiplier = carriage.classType === 'First' ? 1.4 : carriage.classType === 'Business' ? 1.8 : 1.0;
      const seatPrice = Number((train.basePrice * multiplier).toFixed(2));

      for (let row = 1; row <= carriage.rows; row++) {
        for (let colIdx = 0; colIdx < carriage.seatsPerRow; colIdx++) {
          const colLetter = columns[colIdx] || `${colIdx + 1}`;
          const seatCode = `${carriage.carriageNumber}-${row}${colLetter}`;
          
          // Verificar si ya está ocupado
          const isOccupied = reservedSeatsSet.has(seatCode);

          seats.push({
            seatNumber: seatCode,
            row,
            column: colLetter,
            classType: carriage.classType,
            status: isOccupied ? 'ocupado' : 'libre',
            price: seatPrice
          });
        }
      }

      return {
        carriageNumber: carriage.carriageNumber,
        classType: carriage.classType,
        seats
      };
    });

    res.status(200).json({
      trainId: train._id ? train._id.toHexString() : train.code,
      trainCode: train.code,
      trainName: train.name,
      date: targetDate,
      totalCarriages: carriagesResponse.length,
      carriages: carriagesResponse
    });
  } catch (error) {
    console.error('Error al generar mapa de asientos:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Error al generar mapa de asientos.' });
  }
}