<script lang="ts">
  interface Props {
    onOpenAuth: () => void;
  }

  let { onOpenAuth }: Props = $props();
</script>

<div class="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-slate-200 border-b border-indigo-900/60 text-xs py-2 px-4 shadow-inner">
  <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-2 text-xs">
      <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs">
        ★
      </span>
      <span>
        <strong class="text-white">Sistema de Usuarios:</strong> Regístrate con tu <strong>Nombre, Apellido, DNI, Correo y Contraseña</strong> (código de 6 dígitos que vence en 10 min) para asociar y consultar tus billetes.
      </span>
    </div>
    <button
      onclick={onOpenAuth}
      class="px-3.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shadow transition-colors flex items-center gap-1.5 shrink-0"
    >
      Crear Cuenta / Iniciar Sesión
    </button>
  </div>
</div>
