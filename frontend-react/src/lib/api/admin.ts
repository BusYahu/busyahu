import type { RequestFn } from './core';

export interface AdminApi {
  createTrain: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export function createAdminApi(request: RequestFn): AdminApi {
  async function createTrain(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result = await request<Record<string, unknown>>('/trains', {
      method: 'POST',
      body: payload,
      normalize: (raw) => (raw ?? {}) as Record<string, unknown>,
    });
    return result.data;
  }

  return { createTrain };
}
