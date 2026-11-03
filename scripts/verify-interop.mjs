#!/usr/bin/env node
/**
 * Verificador de interoperabilidad Express <-> FastAPI <-> React/Svelte.
 *
 * Uso:
 *   node scripts/verify-interop.mjs          # chequeos estáticos (sin servidores)
 *   node scripts/verify-interop.mjs --live   # además consulta los backends locales
 *
 * Los chequeos estáticos no requieren dependencias ni MongoDB: leen los
 * archivos de rutas, clientes y esquemas para comprobar que ambos backends
 * exponen el mismo contrato REST y que ambos frontends comparten las mismas
 * claves de localStorage.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const live = args.has('--live');

const results = [];
let failures = 0;

function check(section, name, ok, detail = '') {
  results.push({ section, name, ok, detail });
  if (!ok) failures += 1;
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function contains(relativePath, pattern, label) {
  const source = read(relativePath);
  const ok = pattern instanceof RegExp ? pattern.test(source) : source.includes(pattern);
  check('Rutas', label, ok, `${relativePath} :: ${pattern}`);
}

// ---------------------------------------------------------------------------
// 1. Variables de entorno alineadas
// ---------------------------------------------------------------------------
function parseEnv(relativePath) {
  const map = new Map();
  for (const line of read(relativePath).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) map.set(match[1], match[2].trim());
  }
  return map;
}

const rootEnv = parseEnv('.env.example');
const expressEnv = parseEnv('backend-express/.env.example');
const fastapiEnv = parseEnv('backend-fastapi/.env.example');

const sharedEnvKeys = [
  'PORT_EXPRESS',
  'PORT_FASTAPI',
  'PORT_REACT',
  'PORT_SVELTE',
  'JWT_SECRET',
  'MONGO_URI',
  'MONGO_INITDB_DATABASE',
];

for (const key of sharedEnvKeys) {
  check(
    'Entorno',
    `${key} compartido`,
    rootEnv.get(key) === expressEnv.get(key) && rootEnv.get(key) === fastapiEnv.get(key),
    `root=${rootEnv.get(key) ?? '<missing>'} express=${expressEnv.get(key) ?? '<missing>'} fastapi=${fastapiEnv.get(key) ?? '<missing>'}`,
  );
}

const jwtSecret = rootEnv.get('JWT_SECRET') ?? '';
check(
  'Entorno',
  'JWT_SECRET por defecto seguro y compartido',
  jwtSecret === 'super_secret_jwt_key_busyahu_prog3_2026_secure',
  jwtSecret,
);

// Los defaults del código deben coincidir con el .env.example.
const expressJwtDefault = 'super_secret_jwt_key_busyahu_prog3_2026_secure';
const fastapiConfig = read('backend-fastapi/app/config.py');
check(
  'Entorno',
  'FastAPI usa el JWT_SECRET por defecto compartido',
  fastapiConfig.includes(`JWT_SECRET: str = os.getenv("JWT_SECRET", "${expressJwtDefault}")`),
  'backend-fastapi/app/config.py',
);

// ---------------------------------------------------------------------------
// 2. Contrato REST estándar en ambos backends
// ---------------------------------------------------------------------------
const contracts = [
  {
    name: 'GET /api/destinations',
    express: [/router\.get\('\/destinations'/, 'backend-express/src/routes/trains.routes.ts'],
    fastapi: [/prefix="\/api\/destinations"/, 'backend-fastapi/app/routers/destinations.py'],
  },
  {
    name: 'GET /api/trains (catálogo)',
    express: [/router\.get\('\/trains', searchTrains\)/, 'backend-express/src/routes/trains.routes.ts'],
    fastapi: [/@router\.get\(\s*""/, 'backend-fastapi/app/routers/trains.py'],
  },
  {
    name: 'GET /api/trains/search',
    express: [/router\.get\('\/trains\/search', searchTrains\)/, 'backend-express/src/routes/trains.routes.ts'],
    fastapi: [/@router\.get\(\s*"\/search"/, 'backend-fastapi/app/routers/trains.py'],
  },
  {
    name: 'POST /api/trains',
    express: [/router\.post\('\/trains', verifyToken, createTrain\)/, 'backend-express/src/routes/trains.routes.ts'],
    fastapi: [/@router\.post\(\s*""/, 'backend-fastapi/app/routers/trains.py'],
  },
  {
    name: 'GET /api/trains/:id',
    express: [/router\.get\('\/trains\/:id', getTrainById\)/, 'backend-express/src/routes/trains.routes.ts'],
    fastapi: [/@router\.get\(\s*"\/\{train_id\}"/, 'backend-fastapi/app/routers/trains.py'],
  },
  {
    name: 'GET /api/trains/:id/seats',
    express: [/router\.get\('\/trains\/:id\/seats', getTrainSeats\)/, 'backend-express/src/routes/trains.routes.ts'],
    fastapi: [/@router\.get\(\s*"\/\{train_id\}\/seats"/, 'backend-fastapi/app/routers/trains.py'],
  },
  {
    name: 'POST /api/bookings',
    express: [/router\.post\('\/', verifyToken, createBooking\)/, 'backend-express/src/routes/bookings.routes.ts'],
    fastapi: [/@router\.post\(\s*""/, 'backend-fastapi/app/routers/bookings.py'],
  },
  {
    name: 'GET /api/bookings/my-bookings',
    express: [/router\.get\('\/my-bookings', verifyToken, getMyBookings\)/, 'backend-express/src/routes/bookings.routes.ts'],
    fastapi: [/@router\.get\(\s*"\/my-bookings"/, 'backend-fastapi/app/routers/bookings.py'],
  },
  {
    name: 'GET /api/bookings/:id',
    express: [/router\.get\('\/:id', verifyToken, getBookingById\)/, 'backend-express/src/routes/bookings.routes.ts'],
    fastapi: [/@router\.get\(\s*"\/\{booking_id\}"/, 'backend-fastapi/app/routers/bookings.py'],
  },
  {
    name: 'DELETE /api/bookings/:id',
    express: [/router\.delete\('\/:id', verifyToken, cancelBooking\)/, 'backend-express/src/routes/bookings.routes.ts'],
    fastapi: [/@router\.delete\(\s*"\/\{booking_id\}"/, 'backend-fastapi/app/routers/bookings.py'],
  },
  {
    name: 'POST /api/bookings/qr',
    express: [/router\.post\('\/qr', generateBookingQr\)/, 'backend-express/src/routes/bookings.routes.ts'],
    fastapi: [/@router\.post\("\/qr"/, 'backend-fastapi/app/routers/bookings.py'],
  },
  {
    name: 'POST /api/auth/login',
    express: [/router\.post\('\/login'/, 'backend-express/src/routes/auth.routes.ts'],
    fastapi: [/@router\.post\("\/login"/, 'backend-fastapi/app/routers/auth.py'],
  },
  {
    name: 'GET /api/health',
    express: [/app\.get\('\/api\/health'/, 'backend-express/src/server.ts'],
    fastapi: [/@app\.get\("\/api\/health"/, 'backend-fastapi/app/main.py'],
  },
];

for (const contract of contracts) {
  const [expressPattern, expressFile] = contract.express;
  const [fastapiPattern, fastapiFile] = contract.fastapi;
  const expressOk = expressPattern.test(read(expressFile));
  const fastapiOk = fastapiPattern.test(read(fastapiFile));
  check(
    'Contrato REST',
    contract.name,
    expressOk && fastapiOk,
    `express=${expressOk ? 'ok' : 'MISSING'} (${expressFile}) fastapi=${fastapiOk ? 'ok' : 'MISSING'} (${fastapiFile})`,
  );
}

// Paridad del schema de reservas: seatClass debe aceptar Business en ambos.
check(
  'Contrato REST',
  'FastAPI acepta seatClass Business',
  /Literal\["First", "Standard", "Business"\]/.test(
    read('backend-fastapi/app/schemas/booking.py'),
  ),
  'backend-fastapi/app/schemas/booking.py',
);
const expressBookingModel = read('backend-express/src/models/booking.model.ts');
check(
  'Contrato REST',
  'Express acepta seatClass Business',
  expressBookingModel.includes("'Business'"),
  'backend-express/src/models/booking.model.ts',
);

// ---------------------------------------------------------------------------
// 3. Claves de localStorage compartidas entre frontends
// ---------------------------------------------------------------------------
function extractStorageKeys(relativePath) {
  const source = read(relativePath);
  return new Set(source.match(/busyahu_[a-z_]+/g) ?? []);
}

const reactKeys = extractStorageKeys('frontend-react/src/lib/storage.ts');
const svelteKeys = extractStorageKeys('frontend-svelte/src/lib/storage.js');
const expectedKeys = [
  'busyahu_token',
  'busyahu_user',
  'busyahu_active_backend',
  'busyahu_search_filters',
  'busyahu_bookings',
  'busyahu_active_booking',
  'busyahu_environment',
];

for (const key of expectedKeys) {
  check(
    'Almacenamiento',
    key,
    reactKeys.has(key) && svelteKeys.has(key),
    `react=${reactKeys.has(key)} svelte=${svelteKeys.has(key)}`,
  );
}

check(
  'Almacenamiento',
  'React y Svelte exponen el mismo set de claves',
  reactKeys.size === svelteKeys.size &&
    [...reactKeys].every((key) => svelteKeys.has(key)),
  `react=${[...reactKeys].sort().join(',')} svelte=${[...svelteKeys].sort().join(',')}`,
);

// ---------------------------------------------------------------------------
// 4. Clientes con conmutación de backend
// ---------------------------------------------------------------------------
for (const [label, file] of [
  ['React', 'frontend-react/src/lib/apiClient.ts'],
  ['Svelte', 'frontend-svelte/src/lib/api.js'],
]) {
  const source = read(file);
  check('Clientes', `${label} conoce Express`, source.includes('http://localhost:4000/api'), file);
  check('Clientes', `${label} conoce FastAPI`, source.includes('http://localhost:8000/api'), file);
  check(
    'Clientes',
    `${label} persiste el backend activo`,
    /setActiveBackend|STORAGE_KEYS\.activeBackend|busyahu_active_backend/.test(source),
    file,
  );
  check('Clientes', `${label} implementa health checks`, /healthUrl/.test(source), file);
}

// ---------------------------------------------------------------------------
// 5. Verificación en vivo (opcional)
// ---------------------------------------------------------------------------
const BACKENDS = [
  { id: 'express', label: 'Express :4000', base: 'http://localhost:4000' },
  { id: 'fastapi', label: 'FastAPI :8000', base: 'http://localhost:8000' },
];

function shapeOf(value) {
  if (Array.isArray(value)) {
    return value.length ? [shapeOf(value[0])] : ['<empty>'];
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shapeOf(value[key])]),
    );
  }
  return typeof value;
}

function diffShapes(a, b, path = '$', out = []) {
  if (typeof a === 'string' && typeof b === 'string') return out;
  if (a === null || b === null) return out;
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    out.push(`${path}: tipo distinto (${JSON.stringify(a)} vs ${JSON.stringify(b)})`);
    return out;
  }
  if (Array.isArray(a)) {
    if (a.length && b.length) diffShapes(a[0], b[0], `${path}[0]`, out);
    return out;
  }
  if (typeof a === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!(key in a)) out.push(`${path}.${key}: solo en FastAPI`);
      else if (!(key in b)) out.push(`${path}.${key}: solo en Express`);
      else diffShapes(a[key], b[key], `${path}.${key}`, out);
    }
  }
  return out;
}

async function probe(base, path) {
  const response = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(4000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

if (live) {
  const online = [];
  for (const backend of BACKENDS) {
    try {
      const health = await probe(backend.base, '/api/health');
      check('En vivo', `${backend.label} health`, health?.status === 'ok', JSON.stringify(health));
      online.push(backend);
    } catch (error) {
      check('En vivo', `${backend.label} health`, false, error.message);
    }
  }

  if (online.length === 0) {
    check('En vivo', 'Al menos un backend disponible', false, 'inicia Express o FastAPI para la prueba en vivo');
  } else if (online.length === 1) {
    check('En vivo', 'Comparación de contratos', true, `solo ${online[0].label} está en línea; se omite el diff`);
  } else {
    for (const path of ['/api/destinations', '/api/trains', '/api/trains/search']) {
      try {
        const [a, b] = await Promise.all(online.map((backend) => probe(backend.base, path)));
        const differences = diffShapes(shapeOf(a), shapeOf(b));
        check(
          'En vivo',
          `Shape idéntico ${path}`,
          differences.length === 0,
          differences.slice(0, 8).join(' | ') || 'ok',
        );
      } catch (error) {
        check('En vivo', `Shape idéntico ${path}`, false, error.message);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------
let currentSection = '';
for (const result of results) {
  if (result.section !== currentSection) {
    currentSection = result.section;
    console.log(`\n${currentSection}`);
    console.log('-'.repeat(currentSection.length));
  }
  const icon = result.ok ? '✓' : '✗';
  console.log(`${icon} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
}

console.log(`\n${results.length - failures}/${results.length} chequeos OK`);
if (failures > 0) {
  console.error(`\n${failures} chequeo(s) fallaron.`);
  process.exitCode = 1;
} else {
  console.log('Interoperabilidad verificada.');
}
