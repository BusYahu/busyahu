<script>
  import { auth, modal } from '../stores.js';
  import { X, Loader2 } from 'lucide-svelte';

  let isLogin = true;
  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let localError = '';

  $: {
    if ($modal.authModal) {
      name = '';
      email = '';
      password = '';
      confirmPassword = '';
      localError = '';
      isLogin = true;
    }
  }

  async function handleSubmit() {
    localError = '';
    auth.clearError();

    if (!isLogin && password !== confirmPassword) {
      localError = 'Las contraseñas no coinciden';
      return;
    }

    try {
      if (isLogin) {
        await auth.login(email, password);
      } else {
        await auth.register(name, email, password);
      }
      modal.closeAuth();
    } catch (err) {
      localError = err.message;
    }
  }

  function toggleMode() {
    isLogin = !isLogin;
    localError = '';
    auth.clearError();
  }

  function handleClose() {
    modal.closeAuth();
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
</script>

{#if $modal.authModal}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-slate-700">
        <h2 class="text-xl font-bold text-white">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <button
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          on:click={handleClose}
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
        {#if !isLogin}
          <div>
            <label for="name" class="block text-sm font-medium text-slate-300 mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              bind:value={name}
              required
              minlength="2"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>
        {/if}

        <div>
          <label for="email" class="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-300 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            minlength="8"
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {#if !isLogin}
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              required
              minlength="8"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
        {/if}

        {#if localError || $auth.error}
          <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p class="text-sm text-red-400">{localError || $auth.error}</p>
          </div>
        {/if}

        <button
          type="submit"
          disabled={$auth.loading}
          class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {#if $auth.loading}
            <Loader2 class="w-5 h-5 animate-spin" />
          {/if}
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </button>

        <p class="text-center text-sm text-slate-400">
          {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
          <button
            type="button"
            class="text-emerald-400 hover:text-emerald-300 font-medium"
            on:click={toggleMode}
          >
            {isLogin ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>
      </form>
    </div>
  </div>
{/if}
