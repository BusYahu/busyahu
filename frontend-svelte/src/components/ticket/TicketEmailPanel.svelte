<script lang="ts">
  import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-svelte';

  type EmailStatus = 'idle' | 'sending' | 'sent' | 'not_configured' | 'error';

  interface Props {
    emailStatus: EmailStatus;
    statusMessage: string;
    targetEmail: string;
    onSend: (email: string) => void;
  }

  let { emailStatus, statusMessage, targetEmail = $bindable(), onSend }: Props = $props();

  const messageClass: Record<EmailStatus, string> = {
    idle: 'bg-indigo-50 text-indigo-900 border border-indigo-200',
    sending: 'bg-indigo-50 text-indigo-900 border border-indigo-200',
    sent: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
    not_configured: 'bg-amber-50 text-amber-900 border border-amber-200',
    error: 'bg-rose-50 text-rose-900 border border-rose-200',
  };
</script>

<div class="glass-card rounded-2xl p-5 shadow-sm space-y-3 print:hidden">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Mail class="w-5 h-5 text-indigo-600" />
      <h3 class="text-sm font-bold text-slate-900">Envío de Billete por Correo Electrónico</h3>
    </div>
    {#if emailStatus === 'sent'}
      <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
        <CheckCircle2 class="w-3.5 h-3.5" /> Enviado
      </span>
    {:else if emailStatus === 'sending'}
      <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
        <div class="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Enviando...
      </span>
    {:else if emailStatus === 'not_configured'}
      <span class="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
        <AlertCircle class="w-3.5 h-3.5 text-amber-600" /> Pendiente de credenciales
      </span>
    {/if}
  </div>

  {#if statusMessage}
    <div class="p-3 rounded-xl text-xs flex items-start gap-2.5 {messageClass[emailStatus]}">
      {#if emailStatus === 'sent'}
        <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      {:else if emailStatus === 'not_configured'}
        <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      {:else}
        <Mail class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
      {/if}
      <div class="flex-1 leading-relaxed">
        <span>{statusMessage}</span>
        {#if emailStatus === 'not_configured'}
          <div class="mt-1 text-[11px] text-amber-800 font-normal">
            💡 Configura <code>SMTP_USER</code> (tu correo) y <code>SMTP_PASSWORD</code> (tu contraseña de aplicación de 16 caracteres) en <code>docker-compose.yml</code> o en <code>.env</code>.
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <div class="flex gap-2 pt-1">
    <input
      type="email"
      bind:value={targetEmail}
      placeholder="Introduce tu dirección de correo"
      class="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
    />
    <button
      onclick={() => onSend(targetEmail)}
      disabled={emailStatus === 'sending'}
      class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
    >
      <Send class="w-3.5 h-3.5" />
      <span>Enviar Billete</span>
    </button>
  </div>
</div>
