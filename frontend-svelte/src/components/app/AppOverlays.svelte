<script lang="ts">
  import type { ProjectIssue, User } from '../../types';
  import AuthModal from '../AuthModal.svelte';
  import CreateRouteModal from './CreateRouteModal.svelte';
  import ProjectManagementView from '../ProjectManagementView.svelte';

  interface Props {
    isAuthModalOpen: boolean;
    isCreateRouteOpen: boolean;
    isDocsDrawerOpen: boolean;
    issues: ProjectIssue[];
    onCloseAuth: () => void;
    onLoginSuccess: (user: User) => void;
    onCloseCreateRoute: () => void;
    onRouteCreated: () => void;
    onUpdateIssueStatus: (issueId: string, newStatus: ProjectIssue['status']) => void;
  }

  let {
    isAuthModalOpen,
    isCreateRouteOpen,
    isDocsDrawerOpen,
    issues,
    onCloseAuth,
    onLoginSuccess,
    onCloseCreateRoute,
    onRouteCreated,
    onUpdateIssueStatus,
  }: Props = $props();
</script>

<AuthModal
  isOpen={isAuthModalOpen}
  onClose={onCloseAuth}
  {onLoginSuccess}
/>

{#if isCreateRouteOpen}
  <CreateRouteModal onClose={onCloseCreateRoute} onCreated={onRouteCreated} />
{/if}

{#if isDocsDrawerOpen}
  <ProjectManagementView {issues} {onUpdateIssueStatus} />
{/if}
