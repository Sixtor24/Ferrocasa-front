import { apiRequest } from '../client';
import type { ApiItemResponse, ApiListResponse } from '../types';
import type { RolPayload, RolSistema, UsuarioSistema } from '../../types/auth';

export type RolesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchRoles(query: RolesQuery = {}) {
  return apiRequest<ApiListResponse<RolSistema>>('/roles', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
    },
  });
}

export async function createRol(body: RolPayload): Promise<RolSistema> {
  const res = await apiRequest<ApiItemResponse<RolSistema>>('/roles', {
    method: 'POST',
    body,
  });
  return res.data;
}

export async function fetchRolById(id: number): Promise<RolSistema> {
  const res = await apiRequest<ApiItemResponse<RolSistema>>(`/roles/${id}`);
  return res.data;
}

export async function updateRol(id: number, body: RolPayload): Promise<RolSistema> {
  const res = await apiRequest<ApiItemResponse<RolSistema>>(`/roles/${id}`, {
    method: 'PUT',
    body,
  });
  return res.data;
}

export async function deleteRol(id: number): Promise<void> {
  await apiRequest(`/roles/${id}`, { method: 'DELETE' });
}

export async function fetchRolUsuarios(id: number): Promise<UsuarioSistema[]> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema[]> | ApiListResponse<UsuarioSistema>>(
    `/roles/${id}/usuarios`,
  );
  return res.data ?? [];
}
