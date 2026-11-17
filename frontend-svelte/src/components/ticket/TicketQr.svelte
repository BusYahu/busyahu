<script lang="ts">
  import type { Booking } from '../../types';

  interface Props {
    booking: Booking;
    qrImage: string;
  }

  let { booking, qrImage }: Props = $props();
</script>

<div class="sm:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
  <div class="w-28 h-28 bg-white p-2 border border-slate-300 rounded-xl shadow-inner flex items-center justify-center">
    {#if qrImage}
      <img src={qrImage} alt="Codigo QR de acceso" class="w-full h-full object-contain" />
    {:else}
      <svg viewBox="0 0 100 100" class="w-full h-full text-slate-950">
        <rect width="100" height="100" fill="white" />
        <rect x="5" y="5" width="25" height="25" fill="black" />
        <rect x="9" y="9" width="17" height="17" fill="white" />
        <rect x="13" y="13" width="9" height="9" fill="black" />
        <rect x="70" y="5" width="25" height="25" fill="black" />
        <rect x="74" y="9" width="17" height="17" fill="white" />
        <rect x="78" y="13" width="9" height="9" fill="black" />
        <rect x="5" y="70" width="25" height="25" fill="black" />
        <rect x="9" y="74" width="17" height="17" fill="white" />
        <rect x="13" y="78" width="9" height="9" fill="black" />
        <rect x="35" y="10" width="10" height="10" fill="black" />
        <rect x="50" y="15" width="12" height="6" fill="black" />
        <rect x="35" y="35" width="30" height="8" fill="black" />
        <rect x="40" y="50" width="15" height="15" fill="black" />
        <rect x="65" y="45" width="25" height="8" fill="black" />
        <rect x="65" y="60" width="10" height="20" fill="black" />
        <rect x="80" y="75" width="12" height="12" fill="black" />
        <rect x="35" y="75" width="20" height="10" fill="black" />
      </svg>
    {/if}
  </div>
  <div class="text-[10px] font-mono font-bold text-slate-600 uppercase">
    Escanear en Torno
  </div>
  <div class="text-[9px] text-slate-400 font-mono truncate max-w-[130px]">
    {booking.qrPayload}
  </div>
</div>
