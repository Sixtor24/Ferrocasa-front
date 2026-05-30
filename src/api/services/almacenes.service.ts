import { apiRequest } from '../client';
import type {
  ApiAlmacen,
  ApiBien,
  ApiItemResponse,
  ApiListResponse,
  ApiVehiculo,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';

export type AlmacenesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  id_sede?: number;
  id_departamento?: number;
};

export type AlmacenPayload = {
  nombre: string;
  id_sede: number;
  ci_responsable: string;
  id_departamento: number;
};

function mapAlmacenesList(res: ApiListResponse<ApiAlmacen>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchAlmacenes(query: AlmacenesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiAlmacen>>('/almacenes', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      id_sede: query.id_sede,
      id_departamento: query.id_departamento,
    },
  });

  return mapAlmacenesList(res);
}

export async function fetchAlmacenById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen>>(`/almacenes/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchAlmacenesDisponibles() {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen[]> | ApiListResponse<ApiAlmacen>>('/almacenes/disponibles');
  return res.data ?? [];
}

export async function fetchAlmacenesBySede(idSede: number) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen[]> | ApiListResponse<ApiAlmacen>>(
    `/almacenes/sede/${idSede}`
  );

  return res.data ?? [];
}

export async function fetchAlmacenesByResponsable(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen[]> | ApiListResponse<ApiAlmacen>>(
    `/almacenes/responsable/${encodeURIComponent(ci)}`
  );

  return res.data ?? [];
}

export async function fetchAlmacenBienes(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(`/almacenes/${id}/bienes`);
  return (res.data ?? []).map(mapApiBienToBienMueble);
}

export async function fetchAlmacenVehiculos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/almacenes/${id}/vehiculos`
  );
  return (res.data ?? []).map(mapApiVehiculoToVehiculo);
}

export async function createAlmacen(body: AlmacenPayload) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen>>('/almacenes', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateAlmacen(id: number, body: AlmacenPayload) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen>>(`/almacenes/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteAlmacen(id: number) {
  await apiRequest(`/almacenes/${id}`, { method: 'DELETE' });
}
