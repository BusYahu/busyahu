<script lang="ts">
  import type { User } from '../types';
  import { createAuthController } from '../lib/authController.svelte.js';
  import AuthModalShell from './auth/AuthModalShell.svelte';
  import LoginForm from './auth/LoginForm.svelte';
  import RegisterForm from './auth/RegisterForm.svelte';
  import VerifyCodeForm from './auth/VerifyCodeForm.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
  }

  let { isOpen = false, onClose, onLoginSuccess }: Props = $props();

  const auth = createAuthController({
    onClose: () => onClose(),
    onLoginSuccess: (user) => onLoginSuccess(user),
  });
  const state = auth.state;
</script>

{#if isOpen}
  <AuthModalShell
    mode={state.mode}
    errorMessage={state.errorMessage}
    successMessage={state.successMessage}
    {onClose}
    onSelectMode={auth.selectMode}
  >
    {#if state.mode === 'login'}
      <LoginForm bind:email={state.email} bind:password={state.password} isLoading={state.isLoading} onSubmit={auth.handleLogin} />
    {:else if state.mode === 'register'}
      <RegisterForm
        bind:firstName={state.firstName}
        bind:lastName={state.lastName}
        bind:email={state.email}
        bind:password={state.password}
        bind:dni={state.dni}
        isLoading={state.isLoading}
        onSubmit={auth.handleRegisterRequest}
      />
    {:else}
      <VerifyCodeForm
        email={state.email}
        bind:verificationCode={state.verificationCode}
        timeLeftSeconds={auth.timeLeftSeconds()}
        isLoading={state.isLoading}
        onSubmit={auth.handleVerifyCode}
        onBack={() => auth.selectMode('register')}
        onResend={auth.handleResendCode}
      />
    {/if}
  </AuthModalShell>
{/if}
