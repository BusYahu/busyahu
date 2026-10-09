<script lang="ts">
  import type { Booking } from '../types';
  import { 
    CheckCircle2, 
    Printer, 
    Train, 
    Calendar, 
    Clock, 
    ShieldCheck,
    ArrowRight,
    Luggage,
    Ticket,
    Mail,
    Send,
    AlertCircle
  } from 'lucide-svelte';

  interface Props {
    booking: Booking;
    onBackToSearch: () => void;
    onGoToMyBookings: () => void;
  }

  let { booking, onBackToSearch, onGoToMyBookings }: Props = $props();

  let targetEmail = $state(booking.userEmail || 'viajero@busyahurail.com');
  let emailStatus = $state<'idle' | 'sending' | 'sent' | 'not_configured' | 'error'>('idle');
  let statusMessage = $state('');

  async function sendEmail(emailToSend: string) {
    if (!emailToSend || !emailToSend.includes('@')) {
      emailStatus = 'error';
      statusMessage = 'Por favor ingresa una dirección de correo válida.';
      return;
    }

    emailStatus = 'sending';
    statusMessage = `Enviando billete oficial a ${emailToSend}...`;

    const payload = {
      recipientEmail: emailToSend,
      to: emailToSend,
      booking: booking
    };

    // Probamos primero el proxy /api/ y luego la conexion directa con el backend
    const endpoints = [
      '/api/bookings/send-direct-email',
      'http://localhost:8000/api/bookings/send-direct-email',
      '/api/send-ticket'
    ];

    let success = false;
    let lastMsg = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            emailStatus = 'sent';
            statusMessage = `¡Billete enviado con éxito a ${emailToSend}! Revisa tu bandeja de entrada o spam.`;
            success = true;
            break;
          } else if (data.configured === false || (data.message && data.message.includes('configur'))) {
            emailStatus = 'not_configured';
            statusMessage = data.message || 'Configuración SMTP pendiente: coloca tu correo y contraseña de aplicación en docker-compose.yml o .env.';
            success = true;
            break;
          } else {
            lastMsg = data.message || data.error || 'Error al procesar el envío';
          }
        }
      } catch (e) {
        // Continuamos al siguiente endpoint
      }
    }

    if (!success) {
      if (lastMsg) {
        emailStatus = 'error';
        statusMessage = `Error al enviar correo: ${lastMsg}`;
      } else {
        emailStatus = 'not_configured';
        statusMessage = 'Servidor de correo pendiente: coloca tu correo y contraseña de aplicación en docker-compose.yml o .env.';
      }
    }
  }

  $effect(() => {
    if (booking.userEmail) {
      sendEmail(booking.userEmail);
    }
  });

  function handlePrint() {
    window.print();
  }
</script>

<div id="ticket-confirmation-view" class="max-w-3xl mx-auto space-y-6 pb-16">
  <!-- Top Success Banner -->
  <div class="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
    <div class="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
      <CheckCircle2 class="w-8 h-8" />
    </div>
    <h2 class="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
      ¡Reserva Confirmada y Billete Emitido!
    </h2>
    <p class="text-xs sm:text-sm text-emerald-800 max-w-lg mx-auto">
      Localizador de reserva oficial:
    </p>
    <div class="inline-block bg-white px-4 py-2 rounded-xl border border-emerald-300 font-mono text-base font-black text-emerald-900 shadow-sm tracking-widest">
      {booking.bookingCode}
    </div>
  </div>

  <!-- Real Email Dispatch Status Widget -->
  <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 print:hidden">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Mail class="w-5 h-5 text-indigo-600" />
        <h3 class="text-sm font-bold text-slate-900">Envío de Billete por Correo Electrónico</h3>
      </div>
      {#if emailStatus === 'sent'}
        <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5" /> Enviado
        </span>
      {:else if emailStatus === 'sending'}
        <span class="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
          <div class="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> Enviando...
        </span>
      {:else if emailStatus === 'not_configured'}
        <span class="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
          <AlertCircle class="w-3.5 h-3.5 text-amber-600" /> Pendiente de credenciales
        </span>
      {/if}
    </div>

    {#if statusMessage}
      <div class="p-3 rounded-xl text-xs flex items-start gap-2.5 {emailStatus === 'sent' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : emailStatus === 'not_configured' ? 'bg-amber-50 text-amber-900 border border-amber-200' : emailStatus === 'error' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-indigo-50 text-indigo-900 border border-indigo-200'}">
        {#if emailStatus === 'sent'}
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        {:else if emailStatus === 'not_configured'}
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        {:else}
          <Mail class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        {/if}
        <div class="flex-1 leading-relaxed">
          <span>{statusMessage}</span>
          {#if emailStatus === 'not_configured'}
            <div class="mt-1 text-[11px] text-amber-800 font-normal">
              💡 Configura <code>SMTP_USER</code> (tu correo) y <code>SMTP_PASSWORD</code> (tu contraseña de aplicación de 16 caracteres) en <code>docker-compose.yml</code> o en <code>.env</code>.
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Resend Input -->
    <div class="flex gap-2 pt-1">
      <input
        type="email"
        bind:value={targetEmail}
        placeholder="Introduce tu dirección de correo"
        class="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onclick={() => sendEmail(targetEmail)}
        disabled={emailStatus === 'sending'}
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Enviar Billete</span>
      </button>
    </div>
  </div>

  <!-- Boarding Pass Layout -->
  <div class="bg-white border-2 border-slate-300 rounded-3xl overflow-hidden shadow-xl print:border-none print:shadow-none">
    <!-- Header -->
    <div class="bg-slate-950 text-white p-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-indigo-600 rounded-xl text-white">
          <Train class="w-6 h-6" />
        </div>
        <div>
          <div class="text-xs text-indigo-300 font-mono font-bold tracking-wider uppercase">
            {booking.train.operator} · {booking.train.country}
          </div>
          <div class="text-lg font-black text-white">{booking.train.trainModel}</div>
        </div>
      </div>

      <div class="text-right">
        <span class="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">
          Localizador
        </span>
        <span class="text-xl font-mono font-black text-amber-400">
          {booking.bookingCode}
        </span>
      </div>
    </div>

    <!-- Route details -->
    <div class="p-6 sm:p-8 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-center">
        <!-- Origin -->
        <div class="text-left space-y-1">
          <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Estación de Origen
          </div>
          <div class="text-2xl sm:text-3xl font-black text-slate-900">
            {booking.train.fromCity}
          </div>
          <div class="text-xs text-slate-500 font-medium">
            {booking.train.fromStation}
          </div>
          <div class="text-base font-black text-indigo-600 pt-1 tabular-nums">
            {booking.train.departureTime} h
          </div>
        </div>

        <!-- Duration -->
        <div class="flex flex-col items-center">
          <span class="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Clock class="w-3.5 h-3.5 text-indigo-600" /> {booking.train.duration}
          </span>
          <div class="w-full max-w-[140px] h-1 bg-slate-200 rounded-full my-2.5 relative">
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-700"></div>
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-600"></div>
          </div>
          <span class="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Tren #{booking.train.trainNumber}
          </span>
        </div>

        <!-- Destination -->
        <div class="text-right space-y-1">
          <div class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Estación de Llegada
          </div>
          <div class="text-2xl sm:text-3xl font-black text-slate-900">
            {booking.train.toCity}
          </div>
          <div class="text-xs text-slate-500 font-medium">
            {booking.train.toStation}
          </div>
          <div class="text-base font-black text-indigo-600 pt-1 tabular-nums">
            {booking.train.arrivalTime} h
          </div>
        </div>
      </div>

      <!-- Dotted Line -->
      <div class="relative py-2">
        <div class="border-t-2 border-dashed border-slate-300 w-full"></div>
        <div class="absolute -left-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>
        <div class="absolute -right-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 border border-slate-300"></div>
      </div>

      <!-- Passengers & QR -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        <div class="sm:col-span-8 space-y-3">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Pasajeros & Asientos Asignados
          </div>
          <div class="space-y-2">
            {#each booking.passengers as p, idx}
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div class="font-extrabold text-slate-900 text-sm">{p.fullName}</div>
                  <div class="text-slate-500 font-mono text-[11px]">Doc: {p.passportId}</div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Asiento: {p.seatId}
                  </div>
                  <div class="text-[10px] text-slate-400 capitalize mt-0.5">
                    Clase {p.seatClass}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <div class="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-slate-400" /> Fecha: {booking.travelDate}
            </span>
            <span class="flex items-center gap-1">
              <Luggage class="w-3.5 h-3.5 text-slate-400" /> Equipaje: 2 bultos + 1 mano
            </span>
          </div>
        </div>

        <!-- QR Code -->
        <div class="sm:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
          <div class="w-28 h-28 bg-white p-2 border border-slate-300 rounded-xl shadow-inner flex items-center justify-center">
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
          </div>
          <div class="text-[10px] font-mono font-bold text-slate-600 uppercase">
            Escanear en Torno
          </div>
          <div class="text-[9px] text-slate-400 font-mono truncate max-w-[130px]">
            {booking.qrPayload}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
      <div>
        Emitido el: <strong class="text-slate-700">{booking.createdAt}</strong> · Tarifa total:
        <strong class="text-slate-900 font-mono font-bold">
          {booking.totalPrice} {booking.currency}
        </strong>
      </div>
      <div class="flex items-center gap-1.5 text-emerald-700 font-semibold">
        <ShieldCheck class="w-4 h-4" />
        <span>Billete Nominativo Verificado</span>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 print:hidden">
    <button
      onclick={handlePrint}
      class="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-colors"
    >
      <Printer class="w-4 h-4 text-indigo-600" />
      <span>Imprimir / Descargar Billete PDF</span>
    </button>

    <button
      onclick={onGoToMyBookings}
      class="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
    >
      <Ticket class="w-4 h-4" />
      <span>Ver en Mis Billetes</span>
    </button>

    <button
      onclick={onBackToSearch}
      class="w-full sm:w-auto px-6 py-3 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
    >
      <span>Reservar otro viaje</span>
      <ArrowRight class="w-3.5 h-3.5" />
    </button>
  </div>
</div>
