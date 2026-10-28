<script lang="ts">
  import type { User } from '../types';
  import { 
    X, Mail, Lock, CreditCard, ShieldCheck, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw
  } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: User) => void;
  }

  let { isOpen = false, onClose, onLoginSuccess }: Props = $props();

  let mode = $state<'login' | 'register' | 'verify'>('login');

  // Form fields
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let password = $state('');
  let dni = $state('');

  // 10-Minute Verification state
  let verificationCode = $state('');
  let timeLeftSeconds = $state(600); // 10 minutes (600s)

  // Status & Feedback
  let isLoading = $state(false);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  // 10-Minute Countdown Timer
  $effect(() => {
    let timer: any = null;
    if (mode === 'verify' && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        timeLeftSeconds = timeLeftSeconds > 0 ? timeLeftSeconds - 1 : 0;
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  });

  function formatTimer(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Step 1: Submit Registration Request (sends email & starts 10-min countdown)
  async function handleRegisterRequest(e: Event) {
    e.preventDefault();
    errorMessage = null;
    successMessage = null;

    if (!firstName || !lastName || !email || !password || !dni) {
      errorMessage = 'Por favor completa todos los campos: nombre, apellido, DNI, correo y contraseña.';
      return;
    }

    if (password.length < 6) {
      errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    isLoading = true;

    try {
      const endpoints = [
        '/api/auth/register-request',
        'http://localhost:8000/api/auth/register-request',
        '/api/auth/register',
        'http://localhost:8000/api/auth/register'
      ];

      let resData: any = null;
      let lastErrorMessage = '';

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${firstName.trim()} ${lastName.trim()}`.trim(),
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim().toLowerCase(),
              password,
              dni: dni.trim()
            })
          });

          if (res.ok) {
            resData = await res.json();
            break;
          } else if (res.status === 404) {
            continue;
          } else {
            const err = await res.json().catch(() => ({}));
            let msg = '';
            if (typeof err.detail === 'string') {
              msg = err.detail;
            } else if (Array.isArray(err.detail)) {
              msg = err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
            } else if (err.message) {
              msg = err.message;
            }
            if (msg && !msg.toLowerCase().includes('not found')) {
              lastErrorMessage = msg;
              errorMessage = msg;
              isLoading = false;
              return;
            }
          }
        } catch {
          // Network error or endpoint down, try next
        }
      }

      if (resData && resData.success) {
        mode = 'verify';
        timeLeftSeconds = 600; // 10 minutes reset
        successMessage = '¡Código de verificación enviado! Revisa tu bandeja de entrada o spam.';
      } else {
        errorMessage = lastErrorMessage || 'No se pudo conectar con el servidor para despachar el correo de verificación.';
      }
    } catch (e: any) {
      errorMessage = e?.message || 'Error inesperado al solicitar el código de verificación.';
    } finally {
      isLoading = false;
    }
  }

  // Step 2: Confirm 6-digit Code (validates within 10 minutes)
  async function handleVerifyCode(e: Event) {
    e.preventDefault();
    errorMessage = null;

    if (timeLeftSeconds <= 0) {
      errorMessage = 'El código ha expirado (validez de 10 minutos). Pulsa "Reenviar código" para generar uno nuevo.';
      return;
    }

    if (verificationCode.length !== 6) {
      errorMessage = 'El código debe tener exactamente 6 dígitos numéricos.';
      return;
    }

    isLoading = true;

    try {
      const endpoints = [
        '/api/auth/verify-code',
        'http://localhost:8000/api/auth/verify-code'
      ];

      let userCreated: User | null = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              code: verificationCode.trim()
            })
          });

          if (res.ok) {
            const data = await res.json();
            userCreated = {
              id: data.id,
              email: data.email,
              name: data.name || `${firstName} ${lastName}`,
              firstName: data.firstName || firstName,
              lastName: data.lastName || lastName,
              dni: data.dni || dni,
              role: data.role || 'client',
              isVerified: true,
              token: data.token || data.access_token
            };
            break;
          } else if (res.status === 404) {
            continue;
          } else {
            const err = await res.json().catch(() => ({}));
            let msg = '';
            if (typeof err.detail === 'string') {
              msg = err.detail;
            } else if (Array.isArray(err.detail)) {
              msg = err.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
            } else if (err.message) {
              msg = err.message;
            }
            if (msg && !msg.toLowerCase().includes('not found')) {
              errorMessage = msg;
              isLoading = false;
              return;
            }
          }
        } catch {
          // Try next
        }
      }

      if (userCreated) {
        localStorage.setItem('busyahu_user', JSON.stringify(userCreated));
        onLoginSuccess(userCreated);
        onClose();
      } else {
        errorMessage = errorMessage || 'Código de verificación incorrecto o expirado.';
      }
    } catch {
      errorMessage = 'Error al validar el código con el servidor.';
    } finally {
      isLoading = false;
    }
  }

  // Resend code (resets to fresh 10 minutes)
  async function handleResendCode() {
    isLoading = true;
    errorMessage = null;
    successMessage = null;
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      if (res.ok) {
        timeLeftSeconds = 600;
        successMessage = '¡Nuevo código enviado! Revisa tu bandeja de entrada o spam.';
      } else {
        const err = await res.json().catch(() => ({}));
        errorMessage = err.detail || 'No se pudo reenviar el código de verificación.';
      }
    } catch {
      errorMessage = 'Error de conexión al reenviar el código.';
    } finally {
      isLoading = false;
    }
  }

  // Login handler
  async function handleLogin(e: Event) {
    e.preventDefault();
    errorMessage = null;
    isLoading = true;

    try {
      const endpoints = [
        '/api/auth/login',
        'http://localhost:8000/api/auth/login'
      ];

      let userLogged: User | null = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password
            })
          });

          if (res.ok) {
            const data = await res.json();
            userLogged = {
              id: data.id,
              email: data.email,
              name: data.name,
              firstName: data.firstName || data.name.split(' ')[0] || '',
              lastName: data.lastName || data.name.split(' ')[1] || '',
              dni: data.dni || '49132732',
              role: data.role || 'client',
              isVerified: true,
              token: data.token || data.access_token
            };
            break;
          }
        } catch {}
      }

      if (userLogged) {
        localStorage.setItem('busyahu_user', JSON.stringify(userLogged));
        onLoginSuccess(userLogged);
        onClose();
      } else {
        const stored = localStorage.getItem('busyahu_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email === email.trim().toLowerCase()) {
            onLoginSuccess(parsed);
            onClose();
            return;
          }
        }
        errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      }
    } catch {
      errorMessage = 'Error al conectar con el servidor.';
    } finally {
      isLoading = false;
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
      <div class="bg-slate-950 text-white p-6 relative">
        <button
          onclick={onClose}
          class="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
        
        <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck class="w-4 h-4" />
          <span>Sistema Local de Viajeros</span>
        </div>
        <h2 class="text-xl font-black text-white">
          {#if mode === 'login'} Iniciar Sesión {:else if mode === 'register'} Crear Cuenta {:else} Verificar Correo {/if}
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          {#if mode === 'login'}
            Accede a tus billetes emitidos.
          {:else if mode === 'register'}
            Regístrate para recibir tus billetes y consultar tu historial.
          {:else}
            Introduce el código de 6 dígitos enviado a tu correo.
          {/if}
        </p>

        {#if mode !== 'verify'}
          <div class="flex bg-slate-900 p-1 rounded-xl mt-4 text-xs font-bold border border-slate-800">
            <button
              type="button"
              onclick={() => { mode = 'login'; errorMessage = null; }}
              class="flex-1 py-1.5 rounded-lg transition-colors {mode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
            >
              Ingresar
            </button>
            <button
              type="button"
              onclick={() => { mode = 'register'; errorMessage = null; }}
              class="flex-1 py-1.5 rounded-lg transition-colors {mode === 'register' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
            >
              Registrarme
            </button>
          </div>
        {/if}
      </div>

      <div class="p-6">
        {#if errorMessage}
          <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        {/if}

        {#if successMessage}
          <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-start gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        {/if}

        <!-- 1. LOGIN -->
        {#if mode === 'login'}
          <form onsubmit={handleLogin} class="space-y-4">
            <div>
              <label for="login-email" class="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail class="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  bind:value={email}
                  placeholder="ejemplo@gmail.com"
                  class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="login-password" class="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  bind:value={password}
                  placeholder="••••••••"
                  class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {#if isLoading}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {:else}
                <span>Iniciar Sesión</span>
                <ArrowRight class="w-4 h-4" />
              {/if}
            </button>
          </form>
        {/if}

        <!-- 2. REGISTRO: Nombre, Apellido, DNI, Mail, Contraseña -->
        {#if mode === 'register'}
          <form onsubmit={handleRegisterRequest} class="space-y-3.5">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="reg-name" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombre</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  bind:value={firstName}
                  placeholder="Ej. Lucas"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label for="reg-lastname" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Apellido</label>
                <input
                  id="reg-lastname"
                  type="text"
                  required
                  bind:value={lastName}
                  placeholder="Ej. Gómez"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="reg-dni" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">DNI / Documento</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <CreditCard class="w-4 h-4" />
                </div>
                <input
                  id="reg-dni"
                  type="text"
                  required
                  bind:value={dni}
                  placeholder="Ej. 45920188"
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="reg-email" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Correo Electrónico (Para recibir tus billetes)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail class="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  bind:value={email}
                  placeholder="tu_correo@gmail.com"
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="reg-pwd" class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contraseña (Mínimo 6 caracteres)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock class="w-4 h-4" />
                </div>
                <input
                  id="reg-pwd"
                  type="password"
                  required
                  minlength={6}
                  bind:value={password}
                  placeholder="••••••••"
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
              <Clock class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Te enviaremos un código de seguridad de 6 dígitos que <strong>vence en 10 minutos</strong>.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {#if isLoading}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {:else}
                <span>Enviar Código de Verificación</span>
                <ArrowRight class="w-4 h-4" />
              {/if}
            </button>
          </form>
        {/if}

        <!-- 3. VERIFICACIÓN: Código de 6 dígitos con cuenta regresiva -->
        {#if mode === 'verify'}
          <form onsubmit={handleVerifyCode} class="space-y-4">
            <div class="text-center space-y-1">
              <div class="text-xs text-slate-600">
                Código enviado a: <strong class="text-slate-900 font-mono">{email}</strong>
              </div>

              <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-bold">
                <Clock class="w-3.5 h-3.5" />
                <span>Expira en: {formatTimer(timeLeftSeconds)}</span>
              </div>
            </div>

            <div>
              <label for="code-input" class="block text-xs font-bold text-slate-700 uppercase text-center mb-1.5">Introduce el Código de 6 Dígitos</label>
              <input
                id="code-input"
                type="text"
                maxlength={6}
                required
                bind:value={verificationCode}
                oninput={(e) => (verificationCode = (e.target as HTMLInputElement).value.replace(/\D/g, ''))}
                placeholder="------"
                class="w-full py-3 text-center text-2xl font-mono font-black tracking-[8px] bg-slate-50 border-2 border-indigo-500 rounded-2xl text-slate-900 focus:ring-4 focus:ring-indigo-100"
              />
            </div>


            <button
              type="submit"
              disabled={isLoading || timeLeftSeconds <= 0}
              class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {#if isLoading}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {:else}
                <CheckCircle2 class="w-4 h-4" />
                <span>Verificar y Crear Cuenta</span>
              {/if}
            </button>

            <div class="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onclick={() => { mode = 'register'; errorMessage = null; }}
                class="text-slate-500 hover:text-slate-800 font-medium"
              >
                ← Cambiar datos
              </button>

              <button
                type="button"
                onclick={handleResendCode}
                disabled={isLoading}
                class="text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                <span>Reenviar código (10 min)</span>
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  </div>
{/if}
