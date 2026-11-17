<script lang="ts">
  import type { ProjectIssue } from '../../types';
  import { CheckCircle2, AlertCircle } from 'lucide-svelte';

  interface Props {
    issue: ProjectIssue;
    onUpdateIssueStatus: (issueId: string, newStatus: ProjectIssue['status']) => void;
  }

  let { issue, onUpdateIssueStatus }: Props = $props();
</script>

<div class="glass-card rounded-2xl p-6 shadow-sm space-y-6">
  <div class="border-b border-slate-200 pb-5">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-200">
          Issue #{issue.number.toString().padStart(2, '0')}
        </span>
        <span class="text-xs font-semibold text-slate-500">
          Fase: {issue.phase}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500 font-medium">Asignado a:</span>
        <span class="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
          {issue.assignee}
        </span>
      </div>
    </div>

    <h2 class="text-xl font-black text-slate-900">{issue.title}</h2>
    <div class="mt-2 text-xs font-mono bg-slate-900 text-emerald-400 p-2.5 rounded-lg flex items-center gap-2">
      <span class="text-slate-500">Commit sugerido:</span>
      <span>{issue.conventionalCommit}</span>
    </div>
  </div>

  <div>
    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
      Objetivo de la Issue
    </h4>
    <p class="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
      {issue.objective}
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
      <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
        <CheckCircle2 class="w-4 h-4 text-emerald-600" />
        Alcance Incluido (In Scope)
      </h4>
      <ul class="text-xs text-emerald-900 space-y-1.5 list-disc list-inside">
        {#each issue.scopeIncluded as item}
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
        {#each issue.scopeExcluded as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </div>

  <div>
    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
      Criterios de Aceptación (DoD)
    </h4>
    <div class="space-y-2">
      {#each issue.acceptanceCriteria as criterion, index}
        <div class="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <span class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
            {index + 1}
          </span>
          <span class="text-slate-700 font-medium">{criterion}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="text-xs text-slate-500">
      Evidencias requeridas: <strong class="text-slate-800">{issue.evidences.join(', ')}</strong>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => onUpdateIssueStatus(issue.id, 'completed')}
        class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
      >
        <CheckCircle2 class="w-3.5 h-3.5" />
        <span>Marcar Completada</span>
      </button>
    </div>
  </div>
</div>
