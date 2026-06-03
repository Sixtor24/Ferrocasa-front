import { apiRequest } from '../client';
import type { ApiItemResponse, ApiListResponse } from '../types';
import type {
  ActivarUsuarioPayload,
  UpdateUsuarioPayload,
  UsuarioPayload,
  UsuarioSistema,
} from '../../types/auth';

export type UsuariosQuery = {
  page?: number;
  limit?: number;
  search?: string;
  id_rol?: number;
  activo?: boolean;
};

export async function fetchUsuarios(query: UsuariosQuery = {}) {
  return apiRequest<ApiListResponse<UsuarioSistema>>('/usuarios', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      id_rol: query.id_rol,
      activo: query.activo,
    },
  });
}

export async function createUsuario(body: UsuarioPayload): Promise<UsuarioSistema> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema>>('/usuarios', {
    method: 'POST',
    body,
  });
  return res.data;
}

export async function fetchUsuariosByRol(rolId: number): Promise<UsuarioSistema[]> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema[]> | ApiListResponse<UsuarioSistema>>(
    `/usuarios/rol/${rolId}`,
  );
  return res.data ?? [];
}

export async function fetchUsuarioById(id: number): Promise<UsuarioSistema> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema>>(`/usuarios/${id}`);
  return res.data;
}

export async function updateUsuario(id: number, body: UpdateUsuarioPayload): Promise<UsuarioSistema> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema>>(`/usuarios/${id}`, {
    method: 'PUT',
    body,
  });
  return res.data;
}

export async function activarUsuario(id: number, body: ActivarUsuarioPayload): Promise<UsuarioSistema> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema>>(`/usuarios/${id}/activar`, {
    method: 'PATCH',
    body,
  });
  return res.data;
}

export async function deleteUsuario(id: number): Promise<void> {
  await apiRequest(`/usuarios/${id}`, { method: 'DELETE' });
}
