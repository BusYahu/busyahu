import type { User } from '../../types';
import { normalizeAuthResponse } from '../normalizers';
import { ApiError, type ApiMeta, type RequestFn } from './core';
import { saveSession } from '../storage';

type AuthResult = { token: string; user: User | null; meta: ApiMeta };

export interface AuthApi {
  login: (
    email: string,
    password: string,
    options?: { persist?: boolean },
  ) => Promise<AuthResult>;
  getProfile: () => Promise<User | null>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }) => Promise<AuthResult>;
  registerRequest: (payload: {
    name: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }) => Promise<{
    success: boolean;
    message: string;
    debugCode?: string;
    requiresVerification: boolean;
    token?: string;
    user?: User | null;
    meta: ApiMeta;
  }>;
  verifyCode: (email: string, code: string) => Promise<AuthResult>;
  resendCode: (email: string) => Promise<{ success: boolean; message: string; debugCode?: string }>;
}

export function createAuthApi(request: RequestFn): AuthApi {
  async function login(
    email: string,
    password: string,
    options: { persist?: boolean } = {},
  ): Promise<AuthResult> {
    const result = await request<ReturnType<typeof normalizeAuthResponse>>('/auth/login', {
      method: 'POST',
      body: { email, password },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (options.persist !== false && result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async function getProfile(): Promise<User | null> {
    const result = await request<User | null>('/auth/me', {
      normalize: (raw) => {
        const body = (raw ?? {}) as Record<string, unknown>;
        const nested = (body.user ?? body) as Record<string, unknown>;
        return normalizeAuthResponse({ user: nested }).user;
      },
    });
    return result.data;
  }

  async function register(payload: {
    name: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }): Promise<AuthResult> {
    const result = await request<ReturnType<typeof normalizeAuthResponse>>('/auth/register', {
      method: 'POST',
      body: payload,
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async function registerRequest(payload: {
    name: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
  }): Promise<{
    success: boolean;
    message: string;
    debugCode?: string;
    requiresVerification: boolean;
    token?: string;
    user?: User | null;
    meta: ApiMeta;
  }> {
    try {
      const result = await request<Record<string, unknown>>('/auth/register-request', {
        method: 'POST',
        body: payload,
        normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
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

  async function verifyCode(email: string, code: string): Promise<AuthResult> {
    const result = await request<ReturnType<typeof normalizeAuthResponse>>('/auth/verify-code', {
      method: 'POST',
      body: { email, code },
      normalize: (raw) => normalizeAuthResponse(raw),
    });
    if (result.data.token) {
      saveSession(result.data.user, result.data.token);
    }
    return { token: result.data.token, user: result.data.user, meta: result.meta };
  }

  async function resendCode(
    email: string,
  ): Promise<{ success: boolean; message: string; debugCode?: string }> {
    const result = await request<Record<string, unknown>>('/auth/resend-code', {
      method: 'POST',
      body: { email },
    });
    return {
      success: Boolean(result.data.success ?? true),
      message: String(result.data.message ?? 'Código reenviado.'),
      debugCode: result.data.debugCode ? String(result.data.debugCode) : undefined,
    };
  }

  return {
    login,
    getProfile,
    register,
    registerRequest,
    verifyCode,
    resendCode,
  };
}
