import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth.routes';
import trainRoutes from './routes/trains.routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT_EXPRESS || process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

// Endpoint de Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', backend: 'express', version: '1.0.0' });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api', trainRoutes); // Expone /api/destinations y /api/trains/*

async function start() {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend Express escuchando en http://0.0.0.0:${PORT}`);
  });
}

start();