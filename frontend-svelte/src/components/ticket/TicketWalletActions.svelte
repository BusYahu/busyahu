<script lang="ts">
  interface Props {
    walletLoading: boolean;
    walletMessage: string | null;
    onGenerate: (platform: 'google' | 'apple') => void;
  }

  let { walletLoading, walletMessage, onGenerate }: Props = $props();
</script>

{#if walletMessage}
  <div class="flex items-center justify-center">
    <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">{walletMessage}</span>
  </div>
{/if}
<div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden">
  <button
    onclick={() => onGenerate('google')}
    disabled={walletLoading}
    class="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
  >
    {#if walletLoading}
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    {:else}
      <span>💳 Añadir a Google Wallet</span>
    {/if}
  </button>
  <button
    onclick={() => onGenerate('apple')}
    disabled={walletLoading}
    class="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
  >
    {#if walletLoading}
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    {:else}
      <span>🍎 Añadir a Apple Wallet</span>
    {/if}
  </button>
</div>
