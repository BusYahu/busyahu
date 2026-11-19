<script lang="ts">
  import { CheckCircle2, Clock, RefreshCw } from 'lucide-svelte';

  interface Props {
    email: string;
    verificationCode: string;
    timeLeftSeconds: number;
    isLoading: boolean;
    onSubmit: (event: Event) => void;
    onBack: () => void;
    onResend: () => void;
  }

  let {
    email,
    verificationCode = $bindable(),
    timeLeftSeconds,
    isLoading,
    onSubmit,
    onBack,
    onResend,
  }: Props = $props();

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
  }
</script>

<form onsubmit={onSubmit} class="space-y-4">
  <div class="text-center space-y-1">
    <div class="text-xs text-slate-600">
      Código enviado a: <strong class="text-slate-900 font-mono">{email}</strong>
    </div>

    <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold">
      <Clock class="w-3.5 h-3.5" />
      <span>Expira en: {formatTimer(timeLeftSeconds)}</span>
    </div>
  </div>

  <div>
    <label for="code-input" class="block text-xs font-bold text-slate-700 uppercase text-center mb-1.5">Introduce el Código de 6 Dígitos</label>
    <input
      id="code-input"
      type="text"
      maxlength={6}
      required
      bind:value={verificationCode}
      oninput={(event) =>
        (verificationCode = (event.target as HTMLInputElement).value.replace(/\D/g, ''))}
      placeholder="------"
      class="w-full py-3 text-center text-2xl font-mono font-black tracking-[8px] bg-slate-50 border-2 border-indigo-500 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-100"
    />
  </div>

  <button
    type="submit"
    disabled={isLoading || timeLeftSeconds <= 0}
    class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
  >
    {#if isLoading}
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    {:else}
      <CheckCircle2 class="w-4 h-4" />
      <span>Verificar y Crear Cuenta</span>
    {/if}
  </button>

  <div class="flex items-center justify-between text-xs pt-2">
    <button
      type="button"
      onclick={onBack}
      class="text-slate-500 hover:text-slate-800 font-medium"
    >
      ← Cambiar datos
    </button>

    <button
      type="button"
      onclick={onResend}
      disabled={isLoading}
      class="text-indigo-600 hover:underline font-bold flex items-center gap-1"
    >
      <RefreshCw class="w-3.5 h-3.5" />
      <span>Reenviar código (10 min)</span>
    </button>
  </div>
</form>
