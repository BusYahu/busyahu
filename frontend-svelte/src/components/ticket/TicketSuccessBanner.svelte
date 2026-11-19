<script lang="ts">
  import { CheckCircle2 } from 'lucide-svelte';

  interface Props {
    bookingCode: string;
  }

  let { bookingCode }: Props = $props();
</script>

<div class="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
  <div class="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
    <CheckCircle2 class="w-8 h-8" />
  </div>
  <h2 class="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
    ¡Reserva Confirmada y Billete Emitido!
  </h2>
  <p class="text-xs sm:text-sm text-emerald-800 max-w-lg mx-auto">
    Localizador de reserva oficial:
  </p>
  <div class="inline-block bg-white px-4 py-2 rounded-xl border border-emerald-300 font-mono text-base font-black text-emerald-900 shadow-sm tracking-widest">
    {bookingCode}
  </div>
</div>
