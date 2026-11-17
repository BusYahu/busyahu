<script lang="ts">
  import type { ProjectIssue } from '../../types';

  interface Props {
    issues: ProjectIssue[];
    selectedIssueId: string;
    onSelect: (issueId: string) => void;
  }

  let { issues, selectedIssueId, onSelect }: Props = $props();

  function statusClass(status: ProjectIssue['status']): string {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-800';
    if (status === 'in_progress') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  }
</script>

<div class="lg:col-span-4 space-y-3">
  <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
    Backlog de Tareas del Proyecto
  </h3>

  <div class="space-y-2 max-h-[750px] overflow-y-auto pr-1">
    {#each issues as issue (issue.id)}
      {@const isSelected = selectedIssueId === issue.id}
      <button
        type="button"
        onclick={() => onSelect(issue.id)}
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
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize {statusClass(issue.status)}">
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
