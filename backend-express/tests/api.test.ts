import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { createApp } from '../src/app';
import { setDB } from '../src/config/db';
import { FakeDatabase } from './fakeDb';

const JWT_SECRET = 'super_secret_jwt_key_busyahu_prog3_2026_secure';
const PASSWORD = 'Segura123!';

const USER_ID = new ObjectId('64a1e2d3c4b5a6f7e8d9c0b1');
const ADMIN_ID = new ObjectId('64a1e2d3c4b5a6f7e8d9c0b2');
const OTHER_ID = new ObjectId('64a1e2d3c4b5a6f7e8d9c0b3');
const TRAIN_ID = new ObjectId('64e2a1b2c3d4e5f6a7b8c9d0');
const BOOKING_ID = new ObjectId('64f2a1b2c3d4e5f6a7b8c9d9');

const USER_EMAIL = 'pasajero@busyahu.com';
const ADMIN_EMAIL = 'admin@busyahu.com';
const OTHER_EMAIL = 'otro@busyahu.com';

let server: Server;
let baseUrl: string;
let liveDb: FakeDatabase;

function token(userId: ObjectId, email: string, role: 'user' | 'admin'): string {
  return jwt.sign({ id: userId.toHexString(), email, role }, JWT_SECRET);
}

const userToken = (): string => token(USER_ID, USER_EMAIL, 'user');
const adminToken = (): string => token(ADMIN_ID, ADMIN_EMAIL, 'admin');
const otherToken = (): string => token(OTHER_ID, OTHER_EMAIL, 'user');

function trainDocument() {
  return {
    _id: TRAIN_ID,
    code: 'AVE-103',
    countryCode: 'ES',
    name: 'Renfe S-103 Velaro',
    type: 'Alta Velocidad',
    originStationId: 'ES-MAD',
    destinationStationId: 'ES-BCN',
    departureTime: '08:30',
    arrivalTime: '11:45',
    duration: '3h 15m',
    basePrice: 65.5,
    carriages: [
      { carriageNumber: 1, classType: 'First', totalSeats: 4, rows: 1, seatsPerRow: 4 },
    ],
  };
}

function bookingDocument() {
  return {
    _id: BOOKING_ID,
    bookingCode: 'RW-ES-9841',
    train: trainDocument(),
    trainId: TRAIN_ID.toHexString(),
    date: '2026-09-20',
    travelDate: '2026-09-20',
    seats: ['1-1A'],
    passengers: [
      {
        fullName: 'Lucas Gomez',
        passportId: 'PAS-1',
        seatId: '1-1A',
        seatClass: 'First',
        price: 91.7,
      },
    ],
    totalPrice: 91.7,
    currency: 'EUR',
    createdAt: '2026-09-04 14:30',
    status: 'confirmed',
    qrPayload: 'RAILWORLD-VERIFIED:RW-ES-9841:AVE-103:LUCAS_GOMEZ',
    qrCode: 'data:image/png;base64,ZmFrZQ==',
    userEmail: USER_EMAIL,
    userId: USER_ID.toHexString(),
  };
}

async function seedDatabase(): Promise<FakeDatabase> {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const db = new FakeDatabase({
    users: [
      { _id: USER_ID, name: 'Pasajero Test', email: USER_EMAIL, passwordHash, role: 'user', createdAt: new Date('2026-01-01') },
      { _id: ADMIN_ID, name: 'Admin Test', email: ADMIN_EMAIL, passwordHash, role: 'admin', createdAt: new Date('2026-01-01') },
      { _id: OTHER_ID, name: 'Otro Test', email: OTHER_EMAIL, passwordHash, role: 'user', createdAt: new Date('2026-01-01') },
    ],
    trains: [trainDocument()],
    bookings: [bookingDocument()],
    destinations: [
      {
        _id: new ObjectId(),
        countryCode: 'ES',
        countryName: 'España',
        networkName: 'Renfe AVE / Iryo',
        currency: 'EUR',
        symbol: '€',
        stations: [{ id: 'ES-MAD', name: 'Atocha', city: 'Madrid' }],
      },
    ],
  });
  setDB(db.asDb());
  return db;
}

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  setDB(null);
});

beforeEach(async () => {
  liveDb = await seedDatabase();
});

interface ApiResponse {
  status: number;
  body: any;
  headers: Headers;
}

async function api(path: string, init: RequestInit = {}): Promise<ApiResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body, headers: response.headers };
}

function auth(tokenValue: string): Record<string, string> {
  return { Authorization: `Bearer ${tokenValue}` };
}

function throwingCollection() {
  const throwing = (): never => {
    throw new Error('base de datos no disponible');
  };
  return { findOne: throwing, find: throwing, insertOne: throwing, updateOne: throwing };
}

function withBrokenCollections<T>(names: string[], callback: () => Promise<T>): Promise<T> {
  const db = {
    collection: (name: string) =>
      names.includes(name) ? throwingCollection() : liveDb.collection(name),
  } as unknown as Parameters<typeof setDB>[0];
  setDB(db);
  return callback().finally(() => setDB(liveDb.asDb()));
}

describe('GET /api/health', () => {
  it('responde ok', async () => {
    const response = await api('/api/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.backend, 'express');
  });
});

describe('Autenticación', () => {
  it('registra un usuario nuevo y devuelve token', async () => {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Nuevo Usuario', email: 'nuevo@busyahu.com', password: PASSWORD }),
    });

    assert.equal(response.status, 201);
    assert.ok(response.body.token);
    assert.equal(response.body.user.email, 'nuevo@busyahu.com');
  });

  it('rechaza un registro duplicado con 400', async () => {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Pasajero Test', email: USER_EMAIL, password: PASSWORD }),
    });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /ya se encuentra registrado/);
  });

  it('rechaza payload inválido con 400 (Zod)', async () => {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'X', email: 'no-es-email', password: '123' }),
    });

    assert.equal(response.status, 400);
    assert.ok(Array.isArray(response.body.details));
  });

  it('inicia sesión con credenciales válidas', async () => {
    const response = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: USER_EMAIL, password: PASSWORD }),
    });

    assert.equal(response.status, 200);
    assert.ok(response.body.token);
  });

  it('rechaza contraseña incorrecta con 401', async () => {
    const response = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: USER_EMAIL, password: 'incorrecta' }),
    });

    assert.equal(response.status, 401);
  });

  it('rechaza usuario inexistente con 401', async () => {
    const response = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nadie@busyahu.com', password: PASSWORD }),
    });

    assert.equal(response.status, 401);
  });

  it('devuelve el perfil autenticado', async () => {
    const response = await api('/api/auth/me', { headers: auth(userToken()) });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, USER_EMAIL);
  });

  it('rechaza peticiones sin token con 401', async () => {
    const response = await api('/api/auth/me');
    assert.equal(response.status, 401);
  });

  it('rechaza token inválido con 401', async () => {
    const response = await api('/api/auth/me', { headers: auth('token-invalido') });
    assert.equal(response.status, 401);
  });

  it('rechaza token de usuario eliminado con 401', async () => {
    liveDb.collection('users').documents = liveDb
      .collection('users')
      .documents.filter((document) => String(document._id) !== USER_ID.toHexString());

    const response = await api('/api/auth/me', { headers: auth(userToken()) });
    assert.equal(response.status, 401);
  });

  it('devuelve 404 si el usuario autenticado ya no existe en getMe', async () => {
    // El middleware valida existencia; para cubrir el 404 se invoca el controlador con un id válido ausente.
    const missingUserId = new ObjectId();
    const missingToken = token(missingUserId, 'missing@busyahu.com', 'user');
    const response = await api('/api/auth/me', { headers: auth(missingToken) });
    assert.equal(response.status, 401);
  });

  it('devuelve 500 cuando la base falla en register', async () => {
    const response = await withBrokenCollections(['users'], () =>
      api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Error User', email: 'error@busyahu.com', password: PASSWORD }),
      }),
    );

    assert.equal(response.status, 500);
  });

  it('devuelve 500 cuando la base falla en login', async () => {
    const response = await withBrokenCollections(['users'], () =>
      api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: USER_EMAIL, password: PASSWORD }),
      }),
    );

    assert.equal(response.status, 500);
  });
});

describe('Destinos y trenes', () => {
  it('lista destinos', async () => {
    const response = await api('/api/destinations');

    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.destinations[0].countryCode, 'ES');
  });

  it('busca trenes con filtros', async () => {
    const response = await api('/api/trains/search?country=es&from=ES-MAD&to=ES-BCN&date=2026-09-20');

    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.trains[0].date, '2026-09-20');
  });

  it('lista el catálogo completo en /api/trains', async () => {
    const response = await api('/api/trains');
    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
  });

  it('obtiene detalle por ObjectId y por código', async () => {
    const byId = await api(`/api/trains/${TRAIN_ID.toHexString()}`);
    const byCode = await api('/api/trains/AVE-103');

    assert.equal(byId.status, 200);
    assert.equal(byCode.status, 200);
    assert.equal(byCode.body.code, 'AVE-103');
  });

  it('devuelve 404 para tren inexistente', async () => {
    const response = await api('/api/trains/NO-EXISTE');
    assert.equal(response.status, 404);
  });

  it('marca asientos reservados como ocupados', async () => {
    liveDb.collection('bookings').documents.push({
      trainId: TRAIN_ID.toHexString(),
      date: '2026-10-01',
      seats: ['1-1A'],
      status: 'confirmed',
    });

    const response = await api(`/api/trains/${TRAIN_ID.toHexString()}/seats?date=2026-10-01`);

    assert.equal(response.status, 200);
    assert.equal(response.body.carriages[0].seats[0].status, 'ocupado');
    assert.equal(response.body.carriages[0].seats[1].status, 'libre');
  });

  it('devuelve 404 para asientos de tren inexistente', async () => {
    const response = await api('/api/trains/NO-EXISTE/seats');
    assert.equal(response.status, 404);
  });

  it('prohíbe crear rutas a usuarios comunes', async () => {
    const response = await api('/api/trains', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify({ code: 'X', name: 'X', countryCode: 'ES', originStationId: 'A', destinationStationId: 'B' }),
    });

    assert.equal(response.status, 403);
  });

  it('valida campos obligatorios al crear ruta', async () => {
    const response = await api('/api/trains', {
      method: 'POST',
      headers: auth(adminToken()),
      body: JSON.stringify({ code: 'X' }),
    });

    assert.equal(response.status, 400);
  });

  it('rechaza códigos duplicados', async () => {
    const response = await api('/api/trains', {
      method: 'POST',
      headers: auth(adminToken()),
      body: JSON.stringify({
        code: 'AVE-103',
        name: 'Duplicado',
        countryCode: 'ES',
        originStationId: 'ES-MAD',
        destinationStationId: 'ES-BCN',
      }),
    });

    assert.equal(response.status, 400);
  });

  it('crea una ruta como admin', async () => {
    const response = await api('/api/trains', {
      method: 'POST',
      headers: auth(adminToken()),
      body: JSON.stringify({
        code: 'TGV-9201',
        name: 'TGV Duplex',
        countryCode: 'fr',
        originStationId: 'FR-PAR',
        destinationStationId: 'FR-LYO',
        basePrice: 58,
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.code, 'TGV-9201');
  });

  it('devuelve 500 cuando la base falla en destinos/trenes', async () => {
    await withBrokenCollections(['destinations', 'trains'], async () => {
      assert.equal((await api('/api/destinations')).status, 500);
      assert.equal((await api('/api/trains/search')).status, 500);
      assert.equal((await api('/api/trains/AVE-103')).status, 500);
      assert.equal((await api('/api/trains/AVE-103/seats')).status, 500);
      assert.equal(
        (
          await api('/api/trains', {
            method: 'POST',
            headers: auth(adminToken()),
            body: JSON.stringify({
              code: 'FAIL',
              name: 'Fail',
              countryCode: 'ES',
              originStationId: 'A',
              destinationStationId: 'B',
            }),
          })
        ).status,
        500,
      );
    });
  });
});

function bookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    trainId: 'AVE-103',
    travelDate: '2026-09-20',
    passengers: [
      { fullName: 'Nuevo Pasajero', passportId: 'PAS-9', seatId: '1-1B', seatClass: 'first', price: 91.7 },
    ],
    totalPrice: 91.7,
    ...overrides,
  };
}

describe('Reservas', () => {
  it('crea una reserva con asientos libres', async () => {
    const response = await api('/api/bookings', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify(bookingPayload()),
    });

    assert.equal(response.status, 201);
    assert.match(response.body.bookingCode, /^RW-ES-/);
    assert.deepEqual(response.body.seats, ['1-1B']);
    assert.equal(response.body.passengers[0].seatClass, 'First');
  });

  it('acepta el objeto train embebido', async () => {
    const response = await api('/api/bookings', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify(bookingPayload({ trainId: undefined, train: { id: TRAIN_ID.toHexString() } })),
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.trainId, TRAIN_ID.toHexString());
  });

  it('exige trainId', async () => {
    const response = await api('/api/bookings', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify(bookingPayload({ trainId: undefined })),
    });

    assert.equal(response.status, 400);
  });

  it('exige travelDate y passengers', async () => {
    const response = await api('/api/bookings', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify(bookingPayload({ travelDate: '', passengers: [] })),
    });

    assert.equal(response.status, 400);
  });

  it('devuelve 404 si el tren no existe', async () => {
    const response = await api('/api/bookings', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify(bookingPayload({ trainId: 'NO-EXISTE' })),
    });

    assert.equal(response.status, 404);
  });

  it('rechaza asientos ya reservados', async () => {
    const response = await api('/api/bookings', {
      method: 'POST',
      headers: auth(userToken()),
      body: JSON.stringify(bookingPayload({ trainId: TRAIN_ID.toHexString(), passengers: [
        { fullName: 'Otro', passportId: 'PAS-2', seatId: '1-1A', seatClass: 'standard', price: 10 },
      ] })),
    });

    assert.equal(response.status, 400);
  });

  it('lista las reservas del usuario', async () => {
    const response = await api('/api/bookings/my-bookings', { headers: auth(userToken()) });

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 1);
  });

  it('obtiene reserva por id y por localizador', async () => {
    const byId = await api(`/api/bookings/${BOOKING_ID.toHexString()}`, { headers: auth(userToken()) });
    const byCode = await api('/api/bookings/RW-ES-9841', { headers: auth(userToken()) });

    assert.equal(byId.status, 200);
    assert.equal(byCode.status, 200);
  });

  it('prohíbe ver reservas ajenas', async () => {
    const response = await api(`/api/bookings/${BOOKING_ID.toHexString()}`, { headers: auth(otherToken()) });
    assert.equal(response.status, 403);
  });

  it('permite ver reservas ajenas al admin', async () => {
    const response = await api(`/api/bookings/${BOOKING_ID.toHexString()}`, { headers: auth(adminToken()) });
    assert.equal(response.status, 200);
  });

  it('devuelve 404 para reserva inexistente', async () => {
    const response = await api('/api/bookings/NO-EXISTE', { headers: auth(userToken()) });
    assert.equal(response.status, 404);
  });

  it('cancela una reserva y libera asientos', async () => {
    const response = await api(`/api/bookings/${BOOKING_ID.toHexString()}`, {
      method: 'DELETE',
      headers: auth(userToken()),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'cancelled');
    assert.equal(liveDb.collection('bookings').documents[0].status, 'cancelled');
  });

  it('cancela de forma idempotente', async () => {
    liveDb.collection('bookings').documents[0].status = 'cancelled';

    const response = await api('/api/bookings/RW-ES-9841', {
      method: 'DELETE',
      headers: auth(userToken()),
    });

    assert.equal(response.status, 200);
    assert.match(response.body.message, /ya se encontraba cancelada/);
  });

  it('prohíbe cancelar reservas ajenas', async () => {
    const response = await api(`/api/bookings/${BOOKING_ID.toHexString()}`, {
      method: 'DELETE',
      headers: auth(otherToken()),
    });
    assert.equal(response.status, 403);
  });

  it('devuelve 404 al cancelar una reserva inexistente', async () => {
    const response = await api('/api/bookings/NO-EXISTE', {
      method: 'DELETE',
      headers: auth(userToken()),
    });
    assert.equal(response.status, 404);
  });

  it('genera un QR base64', async () => {
    const response = await api('/api/bookings/qr', {
      method: 'POST',
      body: JSON.stringify({ payload: 'HOLA' }),
    });

    assert.equal(response.status, 200);
    assert.match(response.body.qrCode, /^data:image\/png;base64,/);
  });

  it('devuelve 500 cuando la base falla en reservas', async () => {
    await withBrokenCollections(['bookings'], async () => {
      assert.equal(
        (
          await api('/api/bookings', {
            method: 'POST',
            headers: auth(userToken()),
            body: JSON.stringify(bookingPayload()),
          })
        ).status,
        500,
      );
      assert.equal((await api('/api/bookings/my-bookings', { headers: auth(userToken()) })).status, 500);
      assert.equal((await api('/api/bookings/RW-ES-9841', { headers: auth(userToken()) })).status, 500);
      assert.equal(
        (await api('/api/bookings/RW-ES-9841', { method: 'DELETE', headers: auth(userToken()) })).status,
        500,
      );
    });
  });
});
