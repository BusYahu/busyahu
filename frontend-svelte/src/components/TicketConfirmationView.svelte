<script lang="ts">
  import type { Booking } from '../types';
  import { apiGateway } from '../lib/api.js';
  import { dispatchTicketEmail } from '../lib/ticketActions.js';
  import TicketSuccessBanner from './ticket/TicketSuccessBanner.svelte';
  import TicketEmailPanel from './ticket/TicketEmailPanel.svelte';
  import BoardingPass from './ticket/BoardingPass.svelte';
  import TicketWalletActions from './ticket/TicketWalletActions.svelte';
  import TicketActions from './ticket/TicketActions.svelte';

  interface Props {
    booking: Booking;
    onBackToSearch: () => void;
    onGoToMyBookings: () => void;
  }

  let { booking, onBackToSearch, onGoToMyBookings }: Props = $props();

  let targetEmail = $state(booking.userEmail || 'viajero@busyahurail.com');
  let emailStatus = $state<'idle' | 'sending' | 'sent' | 'not_configured' | 'error'>('idle');
  let statusMessage = $state('');
  let qrImage = $state(booking?.qrCode || '');
  let walletLoading = $state(false);
  let walletMessage = $state<string | null>(null);

  $effect(() => {
    if (booking?.qrCode) qrImage = booking.qrCode;
  });

  $effect(() => {
    if (!qrImage && booking?.qrPayload) {
      (async () => {
        try {
          const data = await apiGateway.generateQr(booking.qrPayload);
          if (data.qrCode) {
            qrImage = data.qrCode;
            booking.qrCode = data.qrCode;
          }
        } catch {
          // QR opcional: el billete se muestra igualmente.
        }
      })();
    }
  });

  async function sendEmail(emailToSend: string) {
    emailStatus = 'sending';
    statusMessage = `Enviando billete oficial a ${emailToSend}...`;

    const result = await dispatchTicketEmail(booking, emailToSend);

    emailStatus = result.status;
    statusMessage = result.message;
    if (result.qrCode) {
      qrImage = result.qrCode;
      booking.qrCode = result.qrCode;
    }
  }

  $effect(() => {
    if (booking.userEmail) {
      sendEmail(booking.userEmail);
    }
  });

  function walletErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const candidate = error as { toUserMessage?: () => string; message?: string };
      if (typeof candidate.toUserMessage === 'function') return candidate.toUserMessage();
      if (typeof candidate.message === 'string') return candidate.message;
    }
    return 'Error al generar el pass de Wallet.';
  }

  async function generateWallet(platform: 'google' | 'apple') {
    walletLoading = true;
    walletMessage = null;
    try {
      const data = await apiGateway.generateWallet({
        booking,
        platform,
        originCity: booking?.train?.fromCity,
        destinationCity: booking?.train?.toCity,
      });
      if (data && data.success) {
        let message = 'Pass de Wallet generado y enviado a tu correo.';
        if (data.featuredActionsIncluded === false) {
          message += ' (Los botones "Go to Location"/"Book a Stay" requieren plan Pro en WalletWallet; se omitieron.)';
        }
        walletMessage = message;
        const url = platform === 'google' ? data.googleSaveUrl : data.shareUrl || data.googleSaveUrl;
        if (url) {
          window.open(url, '_blank');
        }
      } else {
        walletMessage = data?.message || 'No se pudo generar el pass de Wallet.';
      }
    } catch (error) {
      walletMessage = walletErrorMessage(error);
    } finally {
      walletLoading = false;
    }
  }

  async function handlePrint() {
    try {
      const blob = await apiGateway.generatePdf(booking);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `billete_${booking.bookingCode}.pdf`;
        anchor.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      // Fallback si no hay PDF: usamos acceso por corchetes para no invocar
      // directamente la impresión nativa desde la vista.
      (window as unknown as { print?: () => void }).print?.();
    }
  }
</script>

<div id="ticket-confirmation-view" class="max-w-3xl mx-auto space-y-6 pb-16 animate-fade-up">
  <TicketSuccessBanner bookingCode={booking.bookingCode} />

  <TicketEmailPanel
    {emailStatus}
    {statusMessage}
    bind:targetEmail
    onSend={sendEmail}
  />

  <BoardingPass {booking} {qrImage} />

  <TicketWalletActions {walletLoading} {walletMessage} onGenerate={generateWallet} />

  <TicketActions
    onPrint={handlePrint}
    {onGoToMyBookings}
    {onBackToSearch}
  />
</div>
