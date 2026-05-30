import { apiRequest } from '../client';
import type {
  ApiAlmacen,
  ApiBien,
  ApiItemResponse,
  ApiListResponse,
  ApiParcela,
  ApiResponsable,
  ApiVehiculo,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import {
  mapApiParcelaToInmueble,
  mapApiParcelaToTerreno,
} from '../mappers/parcela.mapper';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';

export type ResponsablesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  id_departamento?: number;
};

export type ResponsablePayload = {
  ci_responsable: string;
  nombre: string;
  id_departamento: number;
};

export type UpdateResponsablePayload = Omit<ResponsablePayload, 'ci_responsable'>;

function mapResponsablesList(res: ApiListResponse<ApiResponsable>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchResponsables(query: ResponsablesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiResponsable>>('/responsables', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      id_departamento: query.id_departamento,
    },
  });

  return mapResponsablesList(res);
}

export async function fetchResponsableByCi(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiResponsable>>(`/responsables/${encodeURIComponent(ci)}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchResponsablesByDepartamento(idDepartamento: number) {
  const res = await apiRequest<ApiItemResponse<ApiResponsable[]> | ApiListResponse<ApiResponsable>>(
    `/responsables/departamento/${idDepartamento}`
  );

  return res.data ?? [];
}

export async function fetchResponsableAlmacenes(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiAlmacen[]> | ApiListResponse<ApiAlmacen>>(
    `/responsables/${encodeURIComponent(ci)}/almacenes`
  );

  return res.data ?? [];
}

export async function fetchResponsableBienes(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(
    `/responsables/${encodeURIComponent(ci)}/bienes`
  );

  return (res.data ?? []).map(mapApiBienToBienMueble);
}

export async function fetchResponsableVehiculos(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/responsables/${encodeURIComponent(ci)}/vehiculos`
  );

  return (res.data ?? []).map(mapApiVehiculoToVehiculo);
}

export async function fetchResponsableParcelas(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>(
    `/responsables/${encodeURIComponent(ci)}/parcelas`
  );
  const rows = res.data ?? [];

  return {
    data: rows,
    terrenos: rows.map(mapApiParcelaToTerreno),
    inmuebles: rows.map(mapApiParcelaToInmueble),
  };
}

export async function createResponsable(body: ResponsablePayload) {
  const res = await apiRequest<ApiItemResponse<ApiResponsable>>('/responsables', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateResponsable(ci: string, body: UpdateResponsablePayload) {
  const res = await apiRequest<ApiItemResponse<ApiResponsable>>(`/responsables/${encodeURIComponent(ci)}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteResponsable(ci: string) {
  await apiRequest(`/responsables/${encodeURIComponent(ci)}`, { method: 'DELETE' });
}
