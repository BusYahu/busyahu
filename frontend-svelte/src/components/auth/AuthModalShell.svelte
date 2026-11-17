<script lang="ts">
  import type { Snippet } from 'svelte';
  import { X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-svelte';

  type AuthMode = 'login' | 'register' | 'verify';

  interface Props {
    mode: AuthMode;
    errorMessage: string | null;
    successMessage: string | null;
    onClose: () => void;
    onSelectMode: (mode: AuthMode) => void;
    children: Snippet;
  }

  let { mode, errorMessage, successMessage, onClose, onSelectMode, children }: Props = $props();

  const subtitles: Record<AuthMode, string> = {
    login: 'Accede a tus billetes emitidos.',
    register: 'Regístrate para recibir tus billetes y consultar tu historial.',
    verify: 'Introduce el código de 6 dígitos enviado a tu correo.',
  };

  const titles: Record<AuthMode, string> = {
    login: 'Iniciar Sesión',
    register: 'Crear Cuenta',
    verify: 'Verificar Correo',
  };
</script>

<div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
  <div class="glass-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
    <div class="bg-slate-950 text-white p-6 relative">
      <button
        onclick={onClose}
        class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
      >
        <X class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
        <ShieldCheck class="w-4 h-4" />
        <span>Sistema Local de Viajeros</span>
      </div>
      <h2 class="text-xl font-black text-white">{titles[mode]}</h2>
      <p class="text-xs text-slate-400 mt-1">{subtitles[mode]}</p>

      {#if mode !== 'verify'}
        <div class="flex bg-slate-900 p-1 rounded-xl mt-4 text-xs font-bold border border-slate-800">
          <button
            type="button"
            onclick={() => onSelectMode('login')}
            class="flex-1 py-1.5 rounded-lg transition-colors {mode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
          >
            Ingresar
          </button>
          <button
            type="button"
            onclick={() => onSelectMode('register')}
            class="flex-1 py-1.5 rounded-lg transition-colors {mode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
          >
            Registrarme
          </button>
        </div>
      {/if}
    </div>

    <div class="p-6">
      {#if errorMessage}
        <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
          <AlertCircle class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      {#if successMessage}
        <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-start gap-2">
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      {/if}

      {@render children()}
    </div>
  </div>
</div>
