/** Fuerza solo mock (sin llamar al API). */
export function useMockDataOnly(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/** Intenta API primero; si falla, usa mock (por defecto en dev). */
export function allowMockFallback(): boolean {
  if (useMockDataOnly()) return true;
  if (import.meta.env.VITE_USE_MOCK_DATA === 'false') return false;
  return import.meta.env.DEV;
}

export function listMeta(total: number, page = 1, limit = 100) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
