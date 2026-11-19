import { normalizeAuthResponse } from '../normalizers.js';
import { ApiError } from './core.js';
import { saveSession } from '../storage.js';

export function createAuthApi(request) {
  async function login(email, password, options = {}) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (options.persist !== false && result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async function getProfile() {
    const result = await request('/auth/me', {
      normalize: (raw) => {
        const body = raw ?? {};
        const nested = body.user ?? body;
        return normalizeAuthResponse({ user: nested }).user;
      },
    });
    return result.data;
  }

  async function register(payload) {
    const result = await request('/auth/register', {
      method: 'POST',
      body: payload,
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async function registerRequest(payload) {
    try {
      const result = await request('/auth/register-request', {
        method: 'POST',
        body: payload,
        normalize: (raw) => raw ?? {},
      });
      return {
        success: Boolean(result.data.success ?? true),
        message: String(result.data.message ?? 'Código de verificación enviado.'),
        debugCode: result.data.debugCode ? String(result.data.debugCode) : undefined,
        requiresVerification: true,
        meta: result.meta,
      };
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 0)) {
        throw error;
      }
      // Express no implementa register-request: usamos su /auth/register.
      const registered = await register(payload);
      return {
        success: true,
        message: 'Cuenta creada exitosamente.',
        requiresVerification: false,
        token: registered.token,
        user: registered.user,
        meta: registered.meta,
      };
    }
  }

  async function verifyCode(email, code) {
    const result = await request('/auth/verify-code', {
      method: 'POST',
      body: { email, code },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async function resendCode(email) {
    const result = await request('/auth/resend-code', {
      method: 'POST',
      body: { email },
    });
    return {
      success: Boolean(result.data.success ?? true),
      message: String(result.data.message ?? 'Código reenviado.'),
      debugCode: result.data.debugCode ? String(result.data.debugCode) : undefined,
    };
  }

  return { login, getProfile, register, registerRequest, verifyCode, resendCode };
}
