<script lang="ts">
  import { ArrowRight, Check, ShieldCheck, User as UserIcon } from 'lucide-svelte';
  import type { User } from '../../types';

  interface Props {
    currentUser: User | null;
    onOpenAuthModal: () => void;
  }

  let { currentUser, onOpenAuthModal }: Props = $props();
</script>

<section class="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/60 flex flex-col md:flex-row items-center justify-between gap-6">
  <div class="space-y-2 max-w-xl text-center md:text-left">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
      <ShieldCheck class="w-4 h-4 text-emerald-400" />
      <span>Sistema de Usuarios Local &amp; Seguro</span>
    </div>
    <h3 class="text-xl sm:text-2xl font-black text-white">
      {#if currentUser}
        ¡Hola de nuevo, {currentUser.name}!
      {:else}
        Crea tu cuenta de viajero para consultar tus billetes
      {/if}
    </h3>
    <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
      {#if currentUser}
        Tienes tu sesión activa con DNI <strong>{currentUser.dni}</strong> y correo <strong>{currentUser.email}</strong>. Todos los billetes que compres se enviarán automáticamente a tu casilla.
      {:else}
        Regístrate con tu <strong>Nombre, Apellido, DNI, Correo y Contraseña</strong>. Recibirás un código de verificación que vence en 10 minutos para proteger tus compras y tener tus billetes disponibles en cualquier momento.
      {/if}
    </p>
  </div>

  <div class="flex items-center gap-3 shrink-0">
    {#if currentUser}
      <div class="text-center md:text-right bg-white/10 backdrop-blur px-4 py-2.5 rounded-2xl border border-white/10">
        <div class="text-xs text-emerald-400 font-bold flex items-center gap-1.5 justify-center md:justify-end">
          <Check class="w-4 h-4" /> Sesión Iniciada
        </div>
        <div class="text-xs text-slate-200 font-mono mt-0.5">DNI: {currentUser.dni}</div>
      </div>
    {:else}
      <button
        onclick={onOpenAuthModal}
        class="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
      >
        <UserIcon class="w-4 h-4" />
        <span>Iniciar Sesión / Crear Cuenta</span>
        <ArrowRight class="w-4 h-4" />
      </button>
    {/if}
  </div>
</section>
