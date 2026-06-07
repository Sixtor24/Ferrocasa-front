import { apiRequest } from '../client';
import type {
  ApiBien,
  ApiDepartamento,
  ApiItemResponse,
  ApiListResponse,
  ApiResponsable,
  ApiVehiculo,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';
import { fetchAllPages, listParams } from '../pagination';

export type DepartamentosQuery = {
  page?: number;
  limit?: number;
  search?: string;
  id_sede?: number;
};

export type DepartamentoPayload = {
  nombre: string;
  id_sede: number;
};

function mapDepartamentosList(res: ApiListResponse<ApiDepartamento>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchDepartamentos(query: DepartamentosQuery = {}) {
  const paging = listParams(query.page, query.limit, 10);
  const res = await apiRequest<ApiListResponse<ApiDepartamento>>('/departamentos', {
    params: {
      ...paging,
      search: query.search,
      id_sede: query.id_sede,
    },
  });

  return mapDepartamentosList(res);
}

export async function fetchAllDepartamentos(query: Omit<DepartamentosQuery, 'page' | 'limit'> = {}) {
  return fetchAllPages(async (page, limit) => fetchDepartamentos({ ...query, page, limit }));
}

export async function fetchDepartamentoById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiDepartamento>>(`/departamentos/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchDepartamentosBySede(idSede: number) {
  const res = await apiRequest<ApiItemResponse<ApiDepartamento[]> | ApiListResponse<ApiDepartamento>>(
    `/departamentos/sede/${idSede}`
  );

  return res.data ?? [];
}

export async function fetchDepartamentoResponsables(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiResponsable[]> | ApiListResponse<ApiResponsable>>(
    `/departamentos/${id}/responsables`
  );

  return res.data ?? [];
}

export async function fetchDepartamentoBienes(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(`/departamentos/${id}/bienes`);
  return (res.data ?? []).map(mapApiBienToBienMueble);
}

export async function fetchDepartamentoVehiculos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/departamentos/${id}/vehiculos`
  );
  return (res.data ?? []).map(mapApiVehiculoToVehiculo);
}

export async function createDepartamento(body: DepartamentoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDepartamento>>('/departamentos', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateDepartamento(id: number, body: DepartamentoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDepartamento>>(`/departamentos/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteDepartamento(id: number) {
  await apiRequest(`/departamentos/${id}`, { method: 'DELETE' });
}
