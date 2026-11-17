<script lang="ts">
  import { CreditCard } from 'lucide-svelte';

  let paymentMethod = $state<'card' | 'bizum' | 'apple_pay'>('card');
  let cardNumber = $state('4532 •••• •••• 8891');
  let cardExpiry = $state('08/29');
  let cardCvv = $state('382');

  const methods = [
    { id: 'card' as const, label: 'Tarjeta', detail: '', icon: CreditCard },
    { id: 'bizum' as const, label: 'Bizum', detail: 'Instantáneo', icon: null },
    { id: 'apple_pay' as const, label: 'Pay', detail: 'Apple / Google', icon: null }
  ];
</script>

<div class="pt-4 border-t border-slate-100 space-y-3">
  <label class="block text-xs font-bold text-slate-700">Método de Pago Seguro</label>
  <div class="grid grid-cols-3 gap-2">
    {#each methods as method (method.id)}
      <button
        type="button"
        onclick={() => (paymentMethod = method.id)}
        class="p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all {paymentMethod ===
        method.id
          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'}"
      >
        {#if method.icon}
          <method.icon class="w-4 h-4" />
          <span>{method.label}</span>
        {:else}
          <span class="text-xs font-black">{method.label}</span>
          <span class="text-[10px]">{method.detail}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if paymentMethod === 'card'}
    <div class="space-y-2.5 pt-2">
      <label class="block">
        <span class="block text-[10px] font-bold text-slate-500 uppercase">Número de Tarjeta</span>
        <input
          type="text"
          bind:value={cardNumber}
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
        />
      </label>
      <div class="grid grid-cols-2 gap-2">
        <label class="block">
          <span class="block text-[10px] font-bold text-slate-500 uppercase">Vencimiento</span>
          <input
            type="text"
            bind:value={cardExpiry}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
          />
        </label>
        <label class="block">
          <span class="block text-[10px] font-bold text-slate-500 uppercase">CVV</span>
          <input
            type="text"
            bind:value={cardCvv}
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
          />
        </label>
      </div>
    </div>
  {/if}
</div>
