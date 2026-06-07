/** Fuerza solo mock (sin llamar al API). */
export function useMockDataOnly(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/** Permite fallback a mock solo cuando se habilita explícitamente para desarrollo local. */
export function allowMockFallback(): boolean {
  if (useMockDataOnly()) return true;
  return import.meta.env.VITE_ALLOW_MOCK_FALLBACK === 'true';
}

import { API_MAX_LIMIT } from './pagination';

export function listMeta(total: number, page = 1, limit = API_MAX_LIMIT) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** API respondió OK pero sin filas; solo usa mock con fallback explícito. */
export function shouldFallbackToMockList(apiRowCount: number): boolean {
  return apiRowCount === 0 && allowMockFallback();
}
