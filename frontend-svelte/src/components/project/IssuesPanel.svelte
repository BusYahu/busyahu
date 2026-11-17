<script lang="ts">
  import type { ProjectIssue } from '../../types';
  import IssueList from './IssueList.svelte';
  import IssueDetail from './IssueDetail.svelte';

  interface Props {
    issues: ProjectIssue[];
    onUpdateIssueStatus: (issueId: string, newStatus: ProjectIssue['status']) => void;
  }

  let { issues = [], onUpdateIssueStatus }: Props = $props();

  let selectedIssueId = $state<string | null>(null);
  let selectedIssue = $derived(issues.find((issue) => issue.id === selectedIssueId) || issues[0]);
  let activeIssueId = $derived(selectedIssue?.id ?? '');
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <IssueList {issues} selectedIssueId={activeIssueId} onSelect={(issueId) => (selectedIssueId = issueId)} />

  <div class="lg:col-span-8">
    {#if selectedIssue}
      <IssueDetail issue={selectedIssue} {onUpdateIssueStatus} />
    {/if}
  </div>
</div>
