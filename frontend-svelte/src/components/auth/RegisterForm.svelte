<script lang="ts">
  import { CreditCard, Mail, Lock, Clock, ArrowRight } from 'lucide-svelte';

  interface Props {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dni: string;
    isLoading: boolean;
    onSubmit: (event: Event) => void;
  }

  let {
    firstName = $bindable(),
    lastName = $bindable(),
    email = $bindable(),
    password = $bindable(),
    dni = $bindable(),
    isLoading,
    onSubmit,
  }: Props = $props();
</script>

<form onsubmit={onSubmit} class="space-y-3.5">
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label for="reg-name" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombre</label>
      <input
        id="reg-name"
        type="text"
        required
        bind:value={firstName}
        placeholder="Ej. Lucas"
        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <div>
      <label for="reg-lastname" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Apellido</label>
      <input
        id="reg-lastname"
        type="text"
        required
        bind:value={lastName}
        placeholder="Ej. Gómez"
        class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  <div>
    <label for="reg-dni" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">DNI / Documento</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <CreditCard class="w-4 h-4" />
      </div>
      <input
        id="reg-dni"
        type="text"
        required
        bind:value={dni}
        placeholder="Ej. 45920188"
        class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  <div>
    <label for="reg-email" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Correo Electrónico (Para recibir tus billetes)</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Mail class="w-4 h-4" />
      </div>
      <input
        id="reg-email"
        type="email"
        required
        bind:value={email}
        placeholder="tu_correo@gmail.com"
        class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  <div>
    <label for="reg-pwd" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contraseña (Mínimo 6 caracteres)</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Lock class="w-4 h-4" />
      </div>
      <input
        id="reg-pwd"
        type="password"
        required
        minlength={6}
        bind:value={password}
        placeholder="••••••••"
        class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  </div>

  <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
    <Clock class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
    <span>Te enviaremos un código de seguridad de 6 dígitos que <strong>vence en 10 minutos</strong>.</span>
  </div>

  <button
    type="submit"
    disabled={isLoading}
    class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
  >
    {#if isLoading}
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    {:else}
      <span>Enviar Código de Verificación</span>
      <ArrowRight class="w-4 h-4" />
    {/if}
  </button>
</form>
