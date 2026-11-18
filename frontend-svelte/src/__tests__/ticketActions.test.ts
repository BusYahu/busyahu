import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/api.js', () => ({
  apiGateway: {
    sendTicketEmail: vi.fn(),
  },
}));

import { apiGateway } from '../lib/api.js';
import { dispatchTicketEmail } from '../lib/ticketActions';

const sendTicketEmail = vi.mocked(apiGateway.sendTicketEmail);

const booking = { id: 'BK-1', bookingCode: 'RW-ES-1' } as never;

describe('dispatchTicketEmail', () => {
  beforeEach(() => {
    sendTicketEmail.mockReset();
  });

  it('valida el correo antes de llamar a la API', async () => {
    const result = await dispatchTicketEmail(booking, 'sin-arroba');

    expect(result.status).toBe('error');
    expect(sendTicketEmail).not.toHaveBeenCalled();
  });

  it('informa envío exitoso con QR', async () => {
    sendTicketEmail.mockResolvedValue({ success: true, qrCode: 'data:image/png;base64,abc' } as never);

    const result = await dispatchTicketEmail(booking, 'ana@test.local');

    expect(result.status).toBe('sent');
    expect(result.qrCode).toContain('data:image');
    expect(result.message).toContain('ana@test.local');
  });

  it('detecta configuración SMTP pendiente', async () => {
    sendTicketEmail.mockResolvedValue({
      success: false,
      configured: false,
      message: 'Configuración SMTP pendiente',
    } as never);

    const result = await dispatchTicketEmail(booking, 'ana@test.local');

    expect(result.status).toBe('not_configured');
  });

  it('devuelve error cuando la API falla', async () => {
    sendTicketEmail.mockResolvedValue({ success: false, message: 'sin servicio' } as never);

    const result = await dispatchTicketEmail(booking, 'ana@test.local');

    expect(result.status).toBe('error');
    expect(result.message).toContain('sin servicio');
  });

  it('usa el mensaje de ApiError si la promesa rechaza', async () => {
    sendTicketEmail.mockRejectedValue({
      toUserMessage: () => 'backend alternativo no disponible',
    });

    const result = await dispatchTicketEmail(booking, 'ana@test.local');

    expect(result.status).toBe('error');
    expect(result.message).toContain('backend alternativo no disponible');
  });
});
