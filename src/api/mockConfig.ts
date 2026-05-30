/** Fuerza solo mock (sin llamar al API). */
export function useMockDataOnly(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

/**
 * Permite usar datos mock si el API falla o devuelve listas vacías.
 * Activo en dev y prod salvo VITE_USE_MOCK_DATA=false (cuando el backend esté completo).
 */
export function allowMockFallback(): boolean {
  if (useMockDataOnly()) return true;
  if (import.meta.env.VITE_USE_MOCK_DATA === 'false') return false;
  return true;
}

export function listMeta(total: number, page = 1, limit = 100) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** API respondió OK pero sin filas (backend incompleto); usar mock. */
export function shouldFallbackToMockList(apiRowCount: number): boolean {
  return apiRowCount === 0 && allowMockFallback();
}
