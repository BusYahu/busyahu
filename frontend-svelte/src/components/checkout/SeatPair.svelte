<script lang="ts">
  import { Check, Lock } from 'lucide-svelte';

  interface Props {
    row: number;
    columns: string[];
    selectedSeats: string[];
    occupiedSeats: string[];
    onSeatClick: (seatId: string) => void;
  }

  let { row, columns, selectedSeats, occupiedSeats, onSeatClick }: Props = $props();
</script>

<div class="flex gap-2">
  {#each columns as col (col)}
    {@const seatId = `${row}-${col}`}
    {@const isOccupied = occupiedSeats.includes(seatId)}
    {@const isSelected = selectedSeats.includes(seatId)}
    <button
      type="button"
      disabled={isOccupied}
      onclick={() => onSeatClick(seatId)}
      class="w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative {isOccupied
        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
        : isSelected
          ? 'bg-indigo-600 text-white shadow-md scale-105 border-2 border-indigo-700'
          : 'bg-white text-slate-800 border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-sm'}"
    >
      <span class="text-[11px] leading-tight">{seatId}</span>
      {#if isOccupied}
        <Lock class="w-2.5 h-2.5 mt-0.5 opacity-60" />
      {/if}
      {#if isSelected}
        <Check class="w-2.5 h-2.5 mt-0.5 text-white" />
      {/if}
    </button>
  {/each}
</div>
