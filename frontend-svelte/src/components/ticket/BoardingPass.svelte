<script lang="ts">
  import type { Booking } from '../../types';
  import BoardingPassHeader from './BoardingPassHeader.svelte';
  import TicketRouteDetails from './TicketRouteDetails.svelte';
  import TicketPassengers from './TicketPassengers.svelte';
  import TicketQr from './TicketQr.svelte';
  import TicketFooter from './TicketFooter.svelte';

  interface Props {
    booking: Booking;
    qrImage: string;
  }

  let { booking, qrImage }: Props = $props();
</script>

<div class="bg-white border-2 border-slate-300 rounded-3xl overflow-hidden shadow-xl print:border-none print:shadow-none">
  <BoardingPassHeader {booking} />

  <div class="p-6 sm:p-8 space-y-6">
    <TicketRouteDetails {booking} />

    <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
      <TicketPassengers {booking} />
      <TicketQr {booking} {qrImage} />
    </div>
  </div>

  <TicketFooter {booking} />
</div>
