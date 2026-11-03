# Issue #11 — Cliente HTTP agnóstico y conmutación entre frameworks

Implementación de una capa de acceso a datos común para que **React** y **Svelte** puedan
alternar en caliente entre **Express (:4000)** y **FastAPI (:8000)** sin recargar la
aplicación y conservando filtros y reservas.

## Arquitectura

```
frontend-react (5173) ─┐
                       ├─► API Gateway Client ─► Express  :4000/api
frontend-svelte (5174) ┘         │                FastAPI  :8000/api
                                 │
                                 ├─ normalización camelCase ↔ snake_case
                                 ├─ health checks + fallback ordenado
                                 └─ mock adapter compartido
```

### Módulos compartidos por frontend

| Responsabilidad | React | Svelte |
| --- | --- | --- |
| Cliente HTTP / gateway | `src/lib/apiClient.ts` | `src/lib/api.js` |
| Normalización de payloads | `src/lib/normalizers.ts` | `src/lib/normalizers.js` |
| Fallback sin backend | `src/lib/mockAdapter.ts` | `src/lib/mockAdapter.js` |
| Estado compartido | `src/lib/storage.ts` | `src/lib/storage.js` |
| Polling de salud | `src/lib/useBackendHealth.ts` | dentro de `App.svelte` |
| Panel de conectividad | `src/components/ConnectivityHub.tsx` | `src/components/ConnectivityHub.svelte` |

## Contrato REST verificado

Ambos backends exponen las mismas rutas y el mismo shape normalizado:

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del backend |
| GET | `/api/destinations` | Catálogo de países y estaciones |
| GET | `/api/trains` | Catálogo completo de trenes |
| GET | `/api/trains/search` | Búsqueda por país/origen/destino/fecha |
| POST | `/api/trains` | Alta de ruta (autenticada) |
| GET | `/api/trains/:id` | Detalle del tren |
| GET | `/api/trains/:id/seats` | Mapa de asientos |
| POST | `/api/bookings` | Emisión de reserva + QR |
| GET | `/api/bookings/my-bookings` | Reservas del usuario |
| GET | `/api/bookings/:id` | Detalle de reserva |
| DELETE | `/api/bookings/:id` | Cancelación |
| POST | `/api/bookings/qr` | QR genérico |
| POST | `/api/auth/login` | Login y token JWT |

La emisión de reservas envía **solo `trainId`** (no el objeto de dominio `train`),
porque FastAPI valida ese campo como `TrainSummary`. Las respuestas de ambos backends
se normalizan a la misma estructura en el cliente.

### Normalización

- **Salida:** el payload canónico es camelCase y se generan alias snake_case para
  compatibilidad con Pydantic y Mongoose.
- **Entrada:** las respuestas se convierten en profundidad a camelCase.
- **Clases de asiento:** `first` / `business` / `standard` se canonicalizan a
  `First` / `Business` / `Standard` en ambos backends.

## Almacenamiento compartido (`localStorage`)

| Clave | Contenido |
| --- | --- |
| `busyahu_token` | JWT de la sesión |
| `busyahu_user` | Usuario autenticado |
| `busyahu_active_backend` | `express` \| `fastapi` |
| `busyahu_search_filters` | Filtros de búsqueda vigentes |
| `busyahu_bookings` | Reservas emitidas |
| `busyahu_active_booking` | Reserva seleccionada / ticket abierto |
| `busyahu_environment` | Entorno/preferencia de frontend |

React y Svelte leen y escriben el mismo esquema, por lo que una reserva creada en un
frontend aparece en el otro y los filtros sobreviven a la conmutación de backend.

## Comportamiento ante fallos

1. El gateway consulta `/api/health` de ambos backends cada pocos segundos.
2. Si el backend activo falla por red, 404 o 5xx, reintenta contra el backend alterno.
3. Si ambos están caídos, usa el **mock adapter compartido** para que la UI siga
   operativa.
4. Los errores de autenticación/validación (401/422) no se reintentan contra el otro
   backend.
5. El panel de conectividad muestra `Express :4000 ONLINE/OFFLINE` y
   `FastAPI :8000 ONLINE/OFFLINE`, permite conmutar y ofrece reintento explícito.

## Configuración

Copiar los ejemplos de entorno:

```bash
cp .env.example .env
cp frontend-react/.env.example frontend-react/.env
cp frontend-svelte/.env.example frontend-svelte/.env
```

Variables de frontend:

```env
VITE_EXPRESS_API_URL=http://localhost:4000/api
VITE_EXPRESS_HEALTH_URL=http://localhost:4000/api/health
VITE_FASTAPI_API_URL=http://localhost:8000/api
VITE_FASTAPI_HEALTH_URL=http://localhost:8000/api/health
VITE_REACT_FRONTEND_URL=http://localhost:5173
VITE_SVELTE_FRONTEND_URL=http://localhost:5174
```

`JWT_SECRET` es compartido por ambos backends
(`super_secret_jwt_key_busyahu_prog3_2026_secure` por defecto), de modo que un token
emitido por Express es válido en FastAPI y viceversa.

## Verificación

Chequeos estáticos (sin dependencias ni servidores):

```bash
node scripts/verify-interop.mjs
# o
npm run verify:interop
```

Chequeos en vivo (requiere Express y/o FastAPI levantados):

```bash
node scripts/verify-interop.mjs --live
```

El script valida:

- Paridad de variables de entorno y JWT.
- Existencia y método de cada ruta del contrato en ambos backends.
- Aceptación de `seatClass` `Business` en ambos modelos.
- Igualdad del set de claves de `localStorage` entre React y Svelte.
- URLs de ambos backends y health checks en ambos clientes.
- Con `--live`: health de cada backend y comparación recursiva del shape JSON de
  `/api/destinations`, `/api/trains` y `/api/trains/search`.

## Evidencia para el PR

1. **DevTools → Network**: conmutar Express → FastAPI y mostrar que las peticiones
   pasan de `:4000/api` a `:8000/api` sin recargar la página.
2. **Panel de conectividad**: captura con ambos backends en ONLINE y el selector de
   entorno visible.
3. **JSON idéntico**: respuesta de `/api/trains/search` (o `/api/destinations`) en
   Express y FastAPI con el mismo shape normalizado.
4. **Persistencia**: crear una reserva en React y verla en Svelte (o viceversa) usando
   las mismas claves de `localStorage`.
