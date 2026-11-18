# Issue #15 — Refactor de calidad, DRY y cobertura de tests

> Rama: `refactor/issue-15-quality-dry-tests-coverage` → `main` (integración por Pull Request).
> Este documento resume el estado **medido** del repositorio tras la refactorización.

## 1. Resultado de las señales en rojo

| Señal | Antes | Ahora | Meta | Estado |
|---|---:|---:|---:|:---:|
| Duplicación (DRY) | 23.1% | **2.69%** | ≤ 15% | OK |
| Acceso HTTP en vistas | 1 | **0** | 0 | OK |
| Depuración olvidada (DBG) | 6 | **0** | 0 | OK |
| Componentes extensos (BigC) | 18 | **0** (ninguno > 150 líneas) | ≤ 1 | OK |
| Baja cohesión (Coh) | 4 | **0** (servicios y mocks divididos por dominio) | 0 | OK |
| Cobertura FastAPI | no medible | **95%** (152 tests) | ≥ 80% | OK |
| Cobertura Express | — | **94.46%** líneas (43 tests) | ≥ 80% | OK |

## 2. Duplicación (jscpd)

Comando ejecutado (mismo que CI):

```bash
npx --yes jscpd --min-tokens 50 --threshold 15 --reporters console \
  --ignore "**/node_modules/**,**/.venv/**,**/dist/**,**/coverage/**,**/.git/**" \
  backend-fastapi/app backend-express/src frontend-react/src frontend-svelte/src
```

Resultado: **332 archivos**, 21.074 líneas, 32 clones, **566 líneas duplicadas (2.69%)**.
El umbral de CI es 15%, por lo que el job `Duplication check (jscpd <= 15%)` pasa.

Cambios que bajaron la duplicación:

- Eliminación del árbol heredado `busyahu/` (versión paralela del frontend).
- Eliminación de `frontend-svelte/src/lib/components/` (versiones duplicadas de
  `AuthModal`, `SearchView`, `PaymentView`, `SeatMap`, `TicketView`, `BookingsView`, `Navbar`).
- Centralización de normalización (`normalizers`), almacenamiento compartido (`storage`),
  constantes de landing (`footerData`), cálculo de tarifas (`seatClasses`) y filtros
  (`searchFilters`).
- Adaptadores mock divididos por dominio en `lib/mock/catalogMock` y `lib/mock/bookingsMock`.

## 3. Componentes extensos (BigC)

Los componentes señalados quedaron como orquestadores y su lógica se repartió en
subcomponentes por responsabilidad. Ningún `.tsx`/`.svelte` supera las **150 líneas**.

- React `App.tsx` → `components/app/*` + hooks (`useAppNavigation`, `useTravelCatalog`,
  `useBookingManager`, `useSessionUser`).
- React `AdminRouteManagementView.tsx` → `components/admin/*` (`RouteTable`, `RouteFormModal`,
  `RouteFormFields`, `RbacGate`, `ParityMatrix`, …).
- React `HeroCarousel`, `TrainResults`, `SiteFooter` → `HeroSlideshow`, `HeroCopy`,
  `HeroSearchCard`, `HeroSearchFields`, `HeroCaption`, `TrainResultCard`,
  `TrainResultsHeader`, `EmptyTrainResults`, `FooterBrand`, `FooterNavColumns`,
  `FooterBottomBar`.
- Svelte `App.svelte` → `components/app/*` + `authController`, `appRuntime`, `bookingSession`.
- Svelte `TrainSearchView`, `SeatSelectionCheckoutView`, `TicketConfirmationView`,
  `AuthModal`, `MyBookingsView`, `ProjectManagementView`, `ConnectivityHub` →
  `components/search/*`, `components/checkout/*`, `components/ticket/*`,
  `components/auth/*`, `components/bookings/*`, `components/project/*`,
  `components/connectivity/*`.

## 4. Capa de servicios y desacoplamiento HTTP

- `frontend-react/src/lib/apiClient.ts` y `frontend-svelte/src/lib/api.js` son ahora
  **fachadas** que componen servicios por dominio.
- Servicios por dominio: `lib/api/core`, `transport`, `auth`, `catalog`, `bookings`,
  `admin`, `health`.
- No hay `fetch`/`axios` dentro de componentes de vista (verificado con búsqueda sobre
  `frontend-react/src/components` y `frontend-svelte/src/components`).
- `ProjectManagementView.svelte` ya no contiene referencias a `fetch`/`axios`; el panel de
  proyecto consume datos y contratos locales a través de sus subcomponentes.

## 5. Depuración olvidada (DBG)

Sin `console.log`, `print` ni `debugger` en código de producción de los archivos señalados:

- `backend-express/src/config/db.ts` → logger estructurado.
- `backend-express/src/server.ts` → logger estructurado.
- `frontend-react/src/components/ETicketModal.tsx`.
- `frontend-svelte/src/components/TicketConfirmationView.svelte`.
- `frontend-svelte/src/lib/components/SearchView.svelte` (eliminado por duplicado).

## 6. Tests y cobertura

### FastAPI (`backend-fastapi`)

```bash
pip install -r requirements.txt
pytest -q
```

- **152 tests**, salida 0, **95%** de cobertura de líneas.
- Artefactos: `coverage.xml` (configurado en `pyproject.toml`).
- `test_smtp.py` ya no ejecuta `sys.exit` al importarse; la suite
  `tests/test_smtp.py` lo cubre con `unittest.mock`/`monkeypatch` (sin red ni SMTP).
- Archivos de test: `test_auth.py`, `test_trains.py`, `test_bookings.py`,
  `test_system.py`, `test_utils.py`, `test_smtp.py`.
- No requiere MongoDB ni SMTP: `tests/conftest.py` usa colecciones en memoria y mocks.

### Express (`backend-express`)

```bash
npm ci
npm run test:coverage
npm run build
```

- **43 tests**, salida 0, **94.46%** de líneas.
- Artefactos: `coverage/lcov.info`, `coverage/coverage-summary.json`.

### React (`frontend-react`)

```bash
npm ci
npm test
npm run build
```

- **32 tests** en 6 archivos (`normalizers`, `apiCore`, `seatClasses`, `storage`,
  `mockCatalog`, `mockBookings`).
- `tsc -b && vite build` sin errores.

### Svelte (`frontend-svelte`)

```bash
npm ci
npm test
npm run check
npm run build
```

- **26 tests** en 6 archivos (`normalizers`, `searchFilters`, `seatClasses`, `mockCatalog`, `mockBookings`, `ticketActions`).
- `svelte-check`: 0 errores. `vite build`: OK.

## 7. Integración

- Los cambios viven en `refactor/issue-15-quality-dry-tests-coverage`.
- No se hicieron commits ni pushes directos a `main`.
- El merge se realiza por Pull Request con revisión cruzada entre los integrantes.
- CI (`.github/workflows/quality.yml`) ejecuta: pytest + cobertura, Express tests +
  cobertura, tests/build de React y Svelte, y el umbral de duplicación (15%).
