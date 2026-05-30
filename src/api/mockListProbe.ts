import { apiRequest } from './client';
import type { ApiListResponse } from './types';
import { allowMockFallback, shouldFallbackToMockList } from './mockConfig';

/** Comprueba si el listado del API está vacío y conviene usar mock. */
export async function shouldUseMockForListEndpoint(path: string): Promise<boolean> {
  if (!allowMockFallback()) return false;
  try {
    const res = await apiRequest<ApiListResponse<unknown>>(path, {
      params: { page: 1, limit: 1 },
    });
    return shouldFallbackToMockList((res.data ?? []).length);
  } catch {
    return true;
  }
}
