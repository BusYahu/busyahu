import type { User } from '../types';
import { apiGateway } from './api.js';
import {
  loginWithCredentials,
  requestRegistration,
  resendVerification,
  validateRegistration,
  verifyRegistration,
} from './authActions.js';
import { createVerificationCountdown } from './authCountdown.svelte.js';
import { saveSession } from './storage.js';

type AuthMode = 'login' | 'register' | 'verify';

interface AuthControllerOptions {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export function createAuthController({ onClose, onLoginSuccess }: AuthControllerOptions) {
  const state = $state({
    mode: 'login' as AuthMode,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dni: '',
    verificationCode: '',
    isLoading: false,
    errorMessage: null as string | null,
    successMessage: null as string | null,
  });

  const countdown = createVerificationCountdown(() => state.mode === 'verify');

  function completeLogin(user: User | null) {
    if (!user) {
      state.errorMessage = 'El backend no devolvió datos de usuario.';
      return;
    }
    saveSession(user, apiGateway.getToken());
    onLoginSuccess(user);
    onClose();
  }

  function selectMode(next: AuthMode) {
    state.mode = next;
    state.errorMessage = null;
  }

  async function handleRegisterRequest(event: Event) {
    event.preventDefault();
    state.errorMessage = null;
    state.successMessage = null;

    const fields = {
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      password: state.password,
      dni: state.dni,
    };
    const validationError = validateRegistration(fields);
    if (validationError) {
      state.errorMessage = validationError;
      return;
    }

    state.isLoading = true;
    const outcome = await requestRegistration(fields);
    state.isLoading = false;

    if (outcome.kind === 'authenticated') {
      completeLogin(outcome.user);
    } else if (outcome.kind === 'verify') {
      state.mode = 'verify';
      countdown.reset();
      state.successMessage = outcome.message;
    } else {
      state.errorMessage = outcome.message;
    }
  }

  async function handleVerifyCode(event: Event) {
    event.preventDefault();
    state.errorMessage = null;

    if (countdown.seconds <= 0) {
      state.errorMessage =
        'El código ha expirado (validez de 10 minutos). Pulsa "Reenviar código" para generar uno nuevo.';
      return;
    }

    if (state.verificationCode.length !== 6) {
      state.errorMessage = 'El código debe tener exactamente 6 dígitos numéricos.';
      return;
    }

    state.isLoading = true;
    const outcome = await verifyRegistration(state.email, state.verificationCode, {
      firstName: state.firstName,
      lastName: state.lastName,
      email: state.email,
      password: state.password,
      dni: state.dni,
    });
    state.isLoading = false;

    if (outcome.kind === 'authenticated') {
      completeLogin(outcome.user);
    } else {
      state.errorMessage = outcome.message;
    }
  }

  async function handleResendCode() {
    state.isLoading = true;
    state.errorMessage = null;
    state.successMessage = null;
    const result = await resendVerification(state.email);
    countdown.reset();
    state.isLoading = false;
    if (result.ok) {
      state.successMessage = result.message;
    } else {
      state.errorMessage = result.message;
    }
  }

  async function handleLogin(event: Event) {
    event.preventDefault();
    state.errorMessage = null;
    state.isLoading = true;
    const outcome = await loginWithCredentials(state.email, state.password);
    state.isLoading = false;
    if (outcome.kind === 'authenticated') {
      completeLogin(outcome.user);
    } else {
      state.errorMessage = outcome.message;
    }
  }

  return {
    state,
    timeLeftSeconds: () => countdown.seconds,
    selectMode,
    handleRegisterRequest,
    handleVerifyCode,
    handleResendCode,
    handleLogin,
  };
}
