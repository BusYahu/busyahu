<script lang="ts">
  import type { User } from '../../types';
  import type { BackendId } from '../../lib/appRuntime.svelte.js';
  import AppHeader from './AppHeader.svelte';
  import ConnectivityHub from '../ConnectivityHub.svelte';
  import AuthCtaStrip from './AuthCtaStrip.svelte';

  type AppView = 'search' | 'seat_selection' | 'confirmation' | 'my_bookings';

  interface Props {
    currentView: AppView;
    currentUser: User | null;
    bookingsCount: number;
    activeBackend: BackendId;
    health: unknown;
    lastResult: unknown;
    loading: boolean;
    onNavigate: (view: AppView) => void;
    onOpenAuth: () => void;
    onLogout: () => void;
    onOpenDocs: () => void;
    onCreateRoute: () => void;
    onSwitchBackend: (backend: BackendId) => void;
    onRefresh: () => void;
    onRetryAlternate: () => void;
  }

  let {
    currentView,
    currentUser,
    bookingsCount,
    activeBackend,
    health,
    lastResult,
    loading,
    onNavigate,
    onOpenAuth,
    onLogout,
    onOpenDocs,
    onCreateRoute,
    onSwitchBackend,
    onRefresh,
    onRetryAlternate,
  }: Props = $props();
</script>

<AppHeader
  {currentView}
  {currentUser}
  {bookingsCount}
  {onNavigate}
  {onOpenAuth}
  {onLogout}
  {onOpenDocs}
  {onCreateRoute}
/>

<ConnectivityHub
  {activeBackend}
  {health}
  {lastResult}
  {loading}
  {onSwitchBackend}
  {onRefresh}
  {onRetryAlternate}
/>

{#if !currentUser}
  <AuthCtaStrip {onOpenAuth} />
{/if}
