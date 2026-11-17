<script lang="ts">
  const endpoints = [
    { method: 'GET', path: '/api/health', auth: 'Pública', description: 'Healthcheck de contenedor y conexión MongoDB' },
    { method: 'POST', path: '/api/auth/register', auth: 'Pública', description: 'Registro de nuevo cliente con contraseña bcrypt' },
    { method: 'POST', path: '/api/auth/login', auth: 'Pública', description: 'Inicio de sesión y emisión de JWT HS256' },
    { method: 'GET', path: '/api/destinations', auth: 'Pública', description: 'Catálogo de los 11 países con ciudades y estaciones' },
    { method: 'GET', path: '/api/trains/search', auth: 'Pública', description: 'Búsqueda filtrada por país, origen, destino y fecha' },
    { method: 'GET', path: '/api/trains/:id/seats', auth: 'Pública', description: 'Mapa de asientos en tiempo real (libres / ocupados)' },
    { method: 'POST', path: '/api/bookings', auth: 'JWT Bearer', description: 'Creación de reserva con bloqueo atómico de asientos y pago simulado' },
    { method: 'GET', path: '/api/bookings/my-bookings', auth: 'JWT Bearer', description: 'Listado de reservas asociadas al usuario autenticado' },
    { method: 'DELETE', path: '/api/bookings/:id', auth: 'JWT Bearer', description: 'Cancelación de reserva y liberación inmediata de asientos' },
  ];

  const methodClass: Record<string, string> = {
    GET: 'text-emerald-600',
    POST: 'text-blue-600',
    DELETE: 'text-rose-600',
  };
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm space-y-4">
  <h3 class="text-lg font-black text-slate-900">
    Especificación del Contrato API REST (Paridad Express ⚡ y FastAPI 🐍)
  </h3>
  <p class="text-xs text-slate-600">
    Ambos servidores responden con exactamente el mismo schema JSON, códigos de estado HTTP y autenticación Bearer JWT.
  </p>

  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
      <thead class="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
        <tr>
          <th class="p-3">Método</th>
          <th class="p-3">Ruta del Endpoint</th>
          <th class="p-3">Auth Requerida</th>
          <th class="p-3">Descripción</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 text-slate-700 font-medium">
        {#each endpoints as endpoint (endpoint.method + endpoint.path)}
          <tr>
            <td class="p-3 font-mono font-bold {methodClass[endpoint.method]}">{endpoint.method}</td>
            <td class="p-3 font-mono">{endpoint.path}</td>
            <td class="p-3">{endpoint.auth}</td>
            <td class="p-3">{endpoint.description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
