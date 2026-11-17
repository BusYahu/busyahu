import { MongoClient, Db } from 'mongodb';
import { logger } from './logger';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/busyahu_db';
// Compose inyecta DATABASE_NAME y MONGO_DB_NAME; ambos apuntan a la misma base
// sembrada por database/mongo-init.js.
const DB_NAME = process.env.MONGO_DB_NAME || process.env.DATABASE_NAME || 'busyahu_db';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (dbInstance) return dbInstance;

  client = new MongoClient(MONGO_URI);
  await client.connect();
  dbInstance = client.db(DB_NAME);
  logger.info(`[MongoDB] Conectado exitosamente a la base: ${DB_NAME}`);
  return dbInstance;
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error('La base de datos no está inicializada. Llama a connectDB primero.');
  }
  return dbInstance;
}

/**
 * Inyección de dependencia para tests: permite usar una base en memoria sin
 * levantar MongoDB. Con `null` se restablece el estado inicial.
 */
export function setDB(db: Db | null): void {
  dbInstance = db;
}

export async function closeDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
  dbInstance = null;
}
