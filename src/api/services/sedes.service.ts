import { apiRequest } from '../client';
import type {
  ApiAlmacen,
  ApiBien,
  ApiDepartamento,
  ApiItemResponse,
  ApiListResponse,
  ApiSede,
  ApiVehiculo,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';

export type SedesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type SedePayload = {
  nombre: string;
  ubicacion: string;
  tipo: string;
};

function mapSedesList(res: ApiListResponse<ApiSede>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchSedes(query: SedesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiSede>>('/sedes', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
    },
  });

  return mapSedesList(res);
}

export async function fetchSedeById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiSede>>(`/sedes/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchSedeAlmacenes(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen[]> | ApiListResponse<ApiAlmacen>>(`/sedes/${id}/almacenes`);
  return res.data ?? [];
}

export async function fetchSedeDepartamentos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiDepartamento[]> | ApiListResponse<ApiDepartamento>>(
    `/sedes/${id}/departamentos`
  );
  return res.data ?? [];
}

export async function fetchSedeBienes(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(`/sedes/${id}/bienes`);
  return (res.data ?? []).map(mapApiBienToBienMueble);
}

export async function fetchSedeVehiculos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(`/sedes/${id}/vehiculos`);
  return (res.data ?? []).map(mapApiVehiculoToVehiculo);
}

export async function createSede(body: SedePayload) {
  const res = await apiRequest<ApiItemResponse<ApiSede>>('/sedes', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateSede(id: number, body: SedePayload) {
  const res = await apiRequest<ApiItemResponse<ApiSede>>(`/sedes/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteSede(id: number) {
  await apiRequest(`/sedes/${id}`, { method: 'DELETE' });
}
