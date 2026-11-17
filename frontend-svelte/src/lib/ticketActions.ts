import type { Booking } from '../types';
import { apiGateway } from './api.js';

export type EmailDispatchStatus = 'sent' | 'not_configured' | 'error';

export interface EmailDispatchResult {
  status: EmailDispatchStatus;
  message: string;
  qrCode?: string;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { toUserMessage?: () => string; message?: string };
    if (typeof candidate.toUserMessage === 'function') return candidate.toUserMessage();
    if (typeof candidate.message === 'string') return candidate.message;
  }
  return 'Error de red al enviar el billete.';
}

export async function dispatchTicketEmail(
  booking: Booking,
  emailToSend: string,
): Promise<EmailDispatchResult> {
  if (!emailToSend || !emailToSend.includes('@')) {
    return { status: 'error', message: 'Por favor ingresa una dirección de correo válida.' };
  }

  try {
    const data = await apiGateway.sendTicketEmail({
      recipientEmail: emailToSend,
      to: emailToSend,
      booking,
    });

    if (data.success) {
      return {
        status: 'sent',
        message: `¡Billete enviado con éxito a ${emailToSend}! Revisa tu bandeja de entrada o spam.`,
        qrCode: data.qrCode ? String(data.qrCode) : undefined,
      };
    }

    if (data.configured === false || String(data.message ?? '').includes('configur')) {
      return {
        status: 'not_configured',
        message:
          String(data.message ?? '') ||
          'Configuración SMTP pendiente: coloca tu correo y contraseña de aplicación en docker-compose.yml o .env.',
      };
    }

    const detail = String(data.message ?? data.error ?? 'Error al procesar el envío');
    return { status: 'error', message: `Error al enviar correo: ${detail}` };
  } catch (error) {
    return { status: 'error', message: `Error al enviar correo: ${errorMessage(error)}` };
  }
}
