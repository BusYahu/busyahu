export interface ParityScenario {
  id: string;
  pairName: string;
  frontend: string;
  backend: string;
  database: string;
  status: string;
  latency: string;
  featuresValidated: string[];
  parityScore: string;
}

export const MATRIX_SCENARIOS: ParityScenario[] = [
  {
    id: 'PAR-01',
    pairName: 'Par Principal #1',
    frontend: '⚛️ React 19 (TypeScript)',
    backend: '⚡ Express (:4000, Node.js)',
    database: '🍃 MongoDB 7.0',
    status: 'PASS',
    latency: '18ms',
    featuresValidated: [
      'GET /api/trains (Filtro por país y ciudades)',
      'POST /api/trains (Protegido con JWT Bearer)',
      'PUT /api/trains/:id (Actualización de tarifas)',
      'DELETE /api/trains/:id (Baja con rol admin)',
    ],
    parityScore: '100% Homogéneo',
  },
  {
    id: 'PAR-02',
    pairName: 'Par Cruzado A #2',
    frontend: '⚛️ React 19 (TypeScript)',
    backend: '🐍 FastAPI (:8000, Python)',
    database: '🍃 MongoDB 7.0 (Motor Async)',
    status: 'PASS',
    latency: '22ms',
    featuresValidated: [
      'GET /api/trains (Serialización Pydantic a CamelCase)',
      'POST /api/trains (Validación 422 si falta campo)',
      'Auth OAuth2 Password Bearer compatible con Express',
      'Consumo directo sin modificar cliente React',
    ],
    parityScore: '100% Homogéneo',
  },
  {
    id: 'PAR-03',
    pairName: 'Par Cruzado B #3',
    frontend: '🔥 Svelte 5 (Runes)',
    backend: '⚡ Express (:4000, Node.js)',
    database: '🍃 MongoDB 7.0',
    status: 'PASS',
    latency: '16ms',
    featuresValidated: [
      'Reactividad nativa de Svelte consumiendo Express',
      'Persistencia de sesión JWT en localStorage',
      'Mapeo de asientos del vagón con misma estructura',
    ],
    parityScore: '100% Homogéneo',
  },
  {
    id: 'PAR-04',
    pairName: 'Par Secundario #4',
    frontend: '🔥 Svelte 5 (Runes)',
    backend: '🐍 FastAPI (:8000, Python)',
    database: '🍃 MongoDB 7.0 (Motor Async)',
    status: 'PASS',
    latency: '20ms',
    featuresValidated: [
      'Consumo de endpoints asíncronos en FastAPI',
      'Manejo de códigos de error RFC 7807 homogéneos',
      'Cancelación y liberación atómica de asientos',
    ],
    parityScore: '100% Homogéneo',
  },
];
