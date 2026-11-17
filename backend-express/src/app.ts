import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import trainRoutes from './routes/trains.routes';
import bookingRoutes from './routes/bookings.routes';

/**
 * Fábrica de la aplicación Express.
 *
 * Mantiene el servidor (`server.ts`) separado del cableado de rutas para poder
 * testear la API sin abrir un puerto real ni depender de MongoDB.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Endpoint de Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', backend: 'express', version: '1.0.0' });
  });

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api', trainRoutes); // Expone /api/destinations y /api/trains/*

  return app;
}

export const app = createApp();
