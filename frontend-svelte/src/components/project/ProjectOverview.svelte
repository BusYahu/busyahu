<script lang="ts">
  import { Layers, GitBranch, Code2, Server } from 'lucide-svelte';
  import ProjectTab from './ProjectTab.svelte';

  type ProjectTabId = 'issues' | 'flow' | 'contract' | 'matrix';

  interface Props {
    issueCount: number;
    activeTab: ProjectTabId;
  }

  let { issueCount, activeTab = $bindable() }: Props = $props();

  const metrics = [
    { value: '11', label: 'Países', tone: 'text-indigo-600' },
    { value: '12', label: 'Issues', tone: 'text-emerald-600' },
    { value: '4', label: 'Servicios', tone: 'text-purple-600' },
  ];
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm">
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

    <div class="flex items-center gap-3">
      {#each metrics as metric (metric.label)}
        <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[90px]">
          <div class="text-2xl font-black {metric.tone} font-mono">{metric.value}</div>
          <div class="text-[10px] uppercase font-bold text-slate-500">{metric.label}</div>
        </div>
      {/each}
    </div>
  </div>

  <div class="flex items-center gap-2 border-t border-slate-200 mt-6 pt-4 overflow-x-auto">
    <ProjectTab
      active={activeTab === 'issues'}
      label={`Paso a Paso & Issues (${issueCount})`}
      icon={Layers}
      onclick={() => (activeTab = 'issues')}
    />
    <ProjectTab
      active={activeTab === 'flow'}
      label="Flujo de Trabajo (Pasos 1 a 4)"
      icon={GitBranch}
      onclick={() => (activeTab = 'flow')}
    />
    <ProjectTab
      active={activeTab === 'contract'}
      label="Contrato API (Express & FastAPI)"
      icon={Code2}
      onclick={() => (activeTab = 'contract')}
    />
    <ProjectTab
      active={activeTab === 'matrix'}
      label="Matriz de Paridad 2x2"
      icon={Server}
      onclick={() => (activeTab = 'matrix')}
    />
  </div>
</div>
