import { MongoClient, Db } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:Admin123!@mongo:27017/busyahu_db?authSource=admin';
const DB_NAME = process.env.MONGO_DB_NAME || 'busyahu_db';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (dbInstance) return dbInstance;

  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    dbInstance = client.db(DB_NAME);
    console.log(`[MongoDB] Conectado exitosamente a la base: ${DB_NAME}`);
    return dbInstance;
  } catch (error) {
    console.error('[MongoDB Error] Fallo al conectar con la base de datos:', error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error('La base de datos no está inicializada. Llama a connectDB primero.');
  }
  return dbInstance;
}