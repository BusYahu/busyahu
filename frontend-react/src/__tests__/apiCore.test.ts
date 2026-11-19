import { describe, expect, it } from 'vitest';
import {
  ApiError,
  alternateBackend,
  buildQuery,
  extractErrorMessage,
  isRetriableStatus,
  nowIso,
  serializeBody,
  unwrapPayload,
} from '../lib/api/core';

describe('utilidades de transporte', () => {
  it('construye query strings ignorando valores vacíos', () => {
    expect(buildQuery()).toBe('');
    expect(buildQuery({ page: 1, q: 'madrid', empty: '', missing: undefined })).toBe(
      '?page=1&q=madrid',
    );
  });

  it('extrae mensajes de error de distintos formatos', () => {
    expect(extractErrorMessage(400, 'texto plano')).toBe('texto plano');
    expect(extractErrorMessage(400, { detail: 'detalle' })).toBe('detalle');
    expect(extractErrorMessage(422, { detail: [{ msg: 'campo inválido' }] })).toBe('campo inválido');
    expect(extractErrorMessage(500, {})).toBe('HTTP 500');
  });

  it('marca estados recuperables y backend alternativo', () => {
    expect(isRetriableStatus(0)).toBe(true);
    expect(isRetriableStatus(404)).toBe(true);
    expect(isRetriableStatus(500)).toBe(true);
    expect(isRetriableStatus(401)).toBe(false);
    expect(alternateBackend('express')).toBe('fastapi');
    expect(alternateBackend('fastapi')).toBe('express');
  });

  it('serializa camelCase con alias snake_case y deserializa a camelCase', () => {
    expect(serializeBody({ basePrice: 10 })).toEqual({ basePrice: 10, base_price: 10 });
    expect(unwrapPayload({ base_price: 10 })).toEqual({ basePrice: 10 });
  });

  it('genera timestamps ISO válidos', () => {
    expect(Number.isNaN(Date.parse(nowIso()))).toBe(false);
  });
});

describe('ApiError', () => {
  it('explica errores de conexión', () => {
    const error = new ApiError({
      message: 'offline',
      status: 0,
      backend: 'express',
      endpoint: '/trains',
    });
    expect(error.toUserMessage()).toContain('No se pudo conectar');
  });

  it('explica 404, 500 y errores de cliente', () => {
    const notFound = new ApiError({ message: 'x', status: 404, backend: 'fastapi', endpoint: '/x' });
    const server = new ApiError({ message: 'x', status: 503, backend: 'fastapi', endpoint: '/x' });
    const unauthorized = new ApiError({
      message: 'token vencido',
      status: 401,
      backend: 'express',
      endpoint: '/auth',
    });

    expect(notFound.toUserMessage()).toContain('no implementa todavía');
    expect(server.toUserMessage()).toContain('error HTTP 503');
    expect(unauthorized.toUserMessage()).toContain('token vencido');
    expect(unauthorized.retryable).toBe(false);
  });
});
