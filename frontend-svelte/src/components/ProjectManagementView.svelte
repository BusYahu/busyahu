<script lang="ts">
  import type { ProjectIssue } from '../types';
  import { 
    GitPullRequest, 
    CheckCircle2, 
    Clock, 
    FileText, 
    GitBranch, 
    Layers, 
    Users, 
    AlertCircle,
    ShieldCheck,
    Code2,
    Server,
    ExternalLink
  } from 'lucide-svelte';

  interface Props {
    issues: ProjectIssue[];
    onUpdateIssueStatus: (issueId: string, newStatus: ProjectIssue['status']) => void;
  }

  let { issues = [], onUpdateIssueStatus }: Props = $props();

  let selectedIssueId = $state<string>(issues[0]?.id || 'ISSUE-01');
  let activeTab = $state<'issues' | 'flow' | 'contract' | 'matrix'>('issues');

  let selectedIssue = $derived(
    issues.find((i) => i.id === selectedIssueId) || issues[0]
  );
</script>

<div class="space-y-6">
  <!-- Cabecera Informativa del Proyecto Académico -->
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200">
            PROG-3 • TRABAJO FINAL 2026
          </span>
          <span class="text-xs text-slate-500 font-medium">
            E.T.E.C. Universidad de Mendoza
          </span>
        </div>
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">
          Gestión de Proyecto: BusYahu (Svelte 5 Frontend)
        </h1>
        <p class="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
          Plataforma de reserva ferroviaria con 11 redes internacionales, arquitectura multi-framework con paridad 100% y despliegue automatizado en Docker Compose.
        </p>
      </div>

      <!-- Resumen Métricas -->
      <div class="flex items-center gap-3">
        <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[90px]">
          <div class="text-2xl font-black text-indigo-600 font-mono">11</div>
          <div class="text-[10px] uppercase font-bold text-slate-500">Países</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[90px]">
          <div class="text-2xl font-black text-emerald-600 font-mono">12</div>
          <div class="text-[10px] uppercase font-bold text-slate-500">Issues</div>
        </div>
        <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[90px]">
          <div class="text-2xl font-black text-purple-600 font-mono">4</div>
          <div class="text-[10px] uppercase font-bold text-slate-500">Servicios</div>
        </div>
      </div>
    </div>

    <!-- Navegación de Pestañas -->
    <div class="flex items-center gap-2 border-t border-slate-200 mt-6 pt-4 overflow-x-auto">
      <button
        onclick={() => activeTab = 'issues'}
        class={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
          activeTab === 'issues'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Layers class="w-4 h-4" />
        <span>Paso a Paso & Issues ({issues.length})</span>
      </button>

      <button
        onclick={() => activeTab = 'flow'}
        class={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
          activeTab === 'flow'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <GitBranch class="w-4 h-4" />
        <span>Flujo de Trabajo (Pasos 1 a 4)</span>
      </button>

      <button
        onclick={() => activeTab = 'contract'}
        class={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
          activeTab === 'contract'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Code2 class="w-4 h-4" />
        <span>Contrato API (Express & FastAPI)</span>
      </button>

      <button
        onclick={() => activeTab = 'matrix'}
        class={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
          activeTab === 'matrix'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Server class="w-4 h-4" />
        <span>Matriz de Paridad 2x2</span>
      </button>
    </div>
  </div>

  <!-- Contenido de la Pestaña Activa -->
  {#if activeTab === 'issues'}
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Columna Izquierda: Lista de las 12 Issues -->
      <div class="lg:col-span-4 space-y-3">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Backlog de Tareas del Proyecto
        </h3>

        <div class="space-y-2 max-h-[750px] overflow-y-auto pr-1">
          {#each issues as issue (issue.id)}
            {@const isSelected = selectedIssueId === issue.id}
            <button
              type="button"
              onclick={() => selectedIssueId = issue.id}
              class={`w-full text-left p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-500 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-xs font-mono font-bold text-indigo-600">
                  #{issue.number.toString().padStart(2, '0')}
                </span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize {
                  issue.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : issue.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                }">
                  {issue.status}
                </span>
              </div>
              <div class="text-xs font-bold text-slate-800 line-clamp-2">
                {issue.title}
              </div>
              <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>{issue.phase}</span>
                <span class="font-medium text-slate-500">{issue.assignee}</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Columna Derecha: Ficha Técnica Detallada de la Issue Seleccionada -->
      <div class="lg:col-span-8">
        {#if selectedIssue}
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
            <!-- Header de la Ficha -->
            <div class="border-b border-slate-200 pb-5">
              <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
                    Issue #{selectedIssue.number.toString().padStart(2, '0')}
                  </span>
                  <span class="text-xs font-semibold text-slate-500">
                    Fase: {selectedIssue.phase}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500 font-medium">Asignado a:</span>
                  <span class="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {selectedIssue.assignee}
                  </span>
                </div>
              </div>

              <h2 class="text-xl font-black text-slate-900">{selectedIssue.title}</h2>
              <div class="mt-2 text-xs font-mono bg-slate-900 text-emerald-400 p-2.5 rounded-lg flex items-center gap-2">
                <span class="text-slate-500">Commit sugerido:</span>
                <span>{selectedIssue.conventionalCommit}</span>
              </div>
            </div>

            <!-- Objetivo -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Objetivo de la Issue
              </h4>
              <p class="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {selectedIssue.objective}
              </p>
            </div>

            <!-- Alcances (Dentro y Fuera) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                  Alcance Incluido (In Scope)
                </h4>
                <ul class="text-xs text-emerald-900 space-y-1.5 list-disc list-inside">
                  {#each selectedIssue.scopeIncluded as item}
                    <li>{item}</li>
                  {/each}
                </ul>
              </div>

              <div class="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2 flex items-center gap-1.5">
                  <AlertCircle class="w-4 h-4 text-rose-600" />
                  Alcance Excluido (Out of Scope)
                </h4>
                <ul class="text-xs text-rose-900 space-y-1.5 list-disc list-inside">
                  {#each selectedIssue.scopeExcluded as item}
                    <li>{item}</li>
                  {/each}
                </ul>
              </div>
            </div>

            <!-- Criterios de Aceptación -->
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Criterios de Aceptación (DoD)
              </h4>
              <div class="space-y-2">
                {#each selectedIssue.acceptanceCriteria as crit, idx}
                  <div class="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span class="text-slate-700 font-medium">{crit}</span>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Evidencias & Simulación de Aprobación -->
            <div class="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="text-xs text-slate-500">
                Evidencias requeridas: <strong class="text-slate-800">{selectedIssue.evidences.join(', ')}</strong>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick={() => onUpdateIssueStatus(selectedIssue.id, 'completed')}
                  class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Marcar Completada</span>
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else if activeTab === 'flow'}
    <!-- Flujo de Trabajo Paso a Paso -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      <h3 class="text-lg font-black text-slate-900">
        Metodología de Desarrollo en 4 Pasos Obligatorios
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div class="text-xs font-mono font-bold text-indigo-600">PASO 1</div>
          <h4 class="text-sm font-bold text-slate-800">Objetivo Principal</h4>
          <p class="text-xs text-slate-600">
            Plataforma centralizada de reservas ferroviarias para 11 redes mundiales, con emisión de ticket y gestión de roles.
          </p>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div class="text-xs font-mono font-bold text-indigo-600">PASO 2</div>
          <h4 class="text-sm font-bold text-slate-800">Límites y Alcances</h4>
          <p class="text-xs text-slate-600">
            Fijar qué está dentro del sistema (catálogo 11 países, checkout, QR) y qué queda fuera (pasarela real de pago, GPS satelital).
          </p>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div class="text-xs font-mono font-bold text-indigo-600">PASO 3</div>
          <h4 class="text-sm font-bold text-slate-800">División en Tareas</h4>
          <p class="text-xs text-slate-600">
            12 issues SMART organizadas en 4 fases secuenciales con criterios de aceptación claros y asignación de equipo.
          </p>
        </div>

        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div class="text-xs font-mono font-bold text-indigo-600">PASO 4</div>
          <h4 class="text-sm font-bold text-slate-800">Desarrollo y CI/CD</h4>
          <p class="text-xs text-slate-600">
            Ramas git por feature, pull requests revisados con capturas de evidencia, Docker Compose y paridad total.
          </p>
        </div>
      </div>
    </div>
  {:else if activeTab === 'contract'}
    <!-- Contrato API REST -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
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
            <tr>
              <td class="p-3 font-mono font-bold text-emerald-600">GET</td>
              <td class="p-3 font-mono">/api/health</td>
              <td class="p-3">Pública</td>
              <td class="p-3">Healthcheck de contenedor y conexión MongoDB</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-blue-600">POST</td>
              <td class="p-3 font-mono">/api/auth/register</td>
              <td class="p-3">Pública</td>
              <td class="p-3">Registro de nuevo cliente con contraseña bcrypt</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-blue-600">POST</td>
              <td class="p-3 font-mono">/api/auth/login</td>
              <td class="p-3">Pública</td>
              <td class="p-3">Inicio de sesión y emisión de JWT HS256</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-emerald-600">GET</td>
              <td class="p-3 font-mono">/api/destinations</td>
              <td class="p-3">Pública</td>
              <td class="p-3">Catálogo de los 11 países con ciudades y estaciones</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-emerald-600">GET</td>
              <td class="p-3 font-mono">/api/trains/search</td>
              <td class="p-3">Pública</td>
              <td class="p-3">Búsqueda filtrada por país, origen, destino y fecha</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-emerald-600">GET</td>
              <td class="p-3 font-mono">/api/trains/:id/seats</td>
              <td class="p-3">Pública</td>
              <td class="p-3">Mapa de asientos en tiempo real (libres / ocupados)</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-blue-600">POST</td>
              <td class="p-3 font-mono">/api/bookings</td>
              <td class="p-3">JWT Bearer</td>
              <td class="p-3">Creación de reserva con bloqueo atómico de asientos y pago simulado</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-emerald-600">GET</td>
              <td class="p-3 font-mono">/api/bookings/my-bookings</td>
              <td class="p-3">JWT Bearer</td>
              <td class="p-3">Listado de reservas asociadas al usuario autenticado</td>
            </tr>
            <tr>
              <td class="p-3 font-mono font-bold text-rose-600">DELETE</td>
              <td class="p-3 font-mono">/api/bookings/:id</td>
              <td class="p-3">JWT Bearer</td>
              <td class="p-3">Cancelación de reserva y liberación inmediata de asientos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  {:else if activeTab === 'matrix'}
    <!-- Matriz de Paridad 2x2 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
      <h3 class="text-lg font-black text-slate-900">
        Matriz de Interoperabilidad 2x2 (Frontends x Backends)
      </h3>
      <p class="text-xs text-slate-600">
        Criterio de aprobación del trabajo final: ambas combinaciones de frontend deben funcionar indistintamente con cualquiera de los dos servidores backend.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2">
          <div class="text-xs font-bold text-indigo-700">Combinación A: React 19 + Express</div>
          <div class="text-xs text-slate-700">Puerto 5173 ➔ Puerto 4000. Validado y funcional.</div>
        </div>

        <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
          <div class="text-xs font-bold text-emerald-700">Combinación B: React 19 + FastAPI</div>
          <div class="text-xs text-slate-700">Puerto 5173 ➔ Puerto 8000. Validado y funcional.</div>
        </div>

        <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
          <div class="text-xs font-bold text-amber-700">Combinación C: Svelte 5 + Express</div>
          <div class="text-xs text-slate-700">Puerto 5174 ➔ Puerto 4000. Conexión idéntica vía fetch / axios.</div>
        </div>

        <div class="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
          <div class="text-xs font-bold text-purple-700">Combinación D: Svelte 5 + FastAPI</div>
          <div class="text-xs text-slate-700">Puerto 5174 ➔ Puerto 8000. Conexión idéntica vía fetch / axios.</div>
        </div>
      </div>
    </div>
  {/if}
</div>
