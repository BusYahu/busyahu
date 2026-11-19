import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDB } from './config/db';
import { logger } from './config/logger';

dotenv.config();

const PORT = Number(process.env.PORT_EXPRESS || process.env.PORT) || 4000;

export async function start(): Promise<void> {
  try {
    await connectDB();
    createApp().listen(PORT, '0.0.0.0', () => {
      logger.info(`Backend Express escuchando en http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    logger.error('No se pudo iniciar el backend Express.', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void start();
}
