<script lang="ts">
  import { Mail, Lock, ArrowRight } from 'lucide-svelte';

  interface Props {
    email: string;
    password: string;
    isLoading: boolean;
    onSubmit: (event: Event) => void;
  }

  let { email = $bindable(), password = $bindable(), isLoading, onSubmit }: Props = $props();
</script>

<form onsubmit={onSubmit} class="space-y-4">
  <div>
    <label for="login-email" class="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Mail class="w-4 h-4" />
      </div>
      <input
        id="login-email"
        type="email"
        required
        bind:value={email}
        placeholder="ejemplo@gmail.com"
        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  <div>
    <label for="login-password" class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Lock class="w-4 h-4" />
      </div>
      <input
        id="login-password"
        type="password"
        required
        bind:value={password}
        placeholder="••••••••"
        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  <button
    type="submit"
    disabled={isLoading}
    class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
  >
    {#if isLoading}
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    {:else}
      <span>Iniciar Sesión</span>
      <ArrowRight class="w-4 h-4" />
    {/if}
  </button>
</form>
