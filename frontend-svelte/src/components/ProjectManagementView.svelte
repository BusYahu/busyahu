<script lang="ts">
  import type { ProjectIssue } from '../types';
  import ProjectOverview from './project/ProjectOverview.svelte';
  import IssuesPanel from './project/IssuesPanel.svelte';
  import WorkflowPanel from './project/WorkflowPanel.svelte';
  import ContractPanel from './project/ContractPanel.svelte';
  import ParityPanel from './project/ParityPanel.svelte';

  interface Props {
    issues: ProjectIssue[];
    onUpdateIssueStatus: (issueId: string, newStatus: ProjectIssue['status']) => void;
  }

  let { issues = [], onUpdateIssueStatus }: Props = $props();

  let activeTab = $state<'issues' | 'flow' | 'contract' | 'matrix'>('issues');
</script>

<div class="space-y-6">
  <ProjectOverview issueCount={issues.length} bind:activeTab />

  {#if activeTab === 'issues'}
    <IssuesPanel {issues} {onUpdateIssueStatus} />
  {:else if activeTab === 'flow'}
    <WorkflowPanel />
  {:else if activeTab === 'contract'}
    <ContractPanel />
  {:else}
    <ParityPanel />
  {/if}
</div>
