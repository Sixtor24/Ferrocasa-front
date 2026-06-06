import { apiRequest } from '../client';
import type {
  ApiBien,
  ApiBienesEstadisticas,
  ApiItemResponse,
  ApiListResponse,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import { fetchAlmacenesCatalog } from './almacenes.service';
import { fetchResponsableByCi } from './responsables.service';
import type { BienMueble } from '../../types/bien';

export type BienesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type EstadoUsoBienApi = 'En_Uso' | 'En_Reparacion' | 'Dado_de_Baja' | 'Almacenado';
export type CondicionFisicaBienApi = 'Bueno' | 'Regular' | 'Dañado' | 'Averiado' | 'Inservible';
export type ConsumibilidadBienApi = 'Perecederos' | 'No_perecedero';

export type BienPayload = {
  descripcion: string;
  id_doc: number;
  fecha_ingreso: string;
  fecha_egreso?: string | null;
  valor_adquisicion: number;
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
  material?: string | null;
  serial?: string | null;
  estado_uso: EstadoUsoBienApi;
  condicion_fisica: CondicionFisicaBienApi;
  id_almacen: number;
  cantidad: number;
  consumibilidad: ConsumibilidadBienApi;
  usuario_carga?: string | null;
  id_categoria_especifica: number;
  observaciones?: string | null;
};

function mapBienesList(res: ApiListResponse<ApiBien>) {
  const rows = res.data ?? [];
  return {
    data: rows.map(mapApiBienToBienMueble),
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapBienesArray(rows: ApiBien[]) {
  return rows.map(mapApiBienToBienMueble);
}

export async function fetchBienes(query: BienesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiBien>>('/bienes', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
    },
  });

  return mapBienesList(res);
}

async function enrichBienConResponsable(apiBien: ApiBien, bien: BienMueble): Promise<BienMueble> {
  if (bien.responsable !== '—') return bien;

  const ci = bien.ciResponsable || apiBien.almacen?.ci_responsable;
  if (!ci) return bien;

  try {
    const responsable = await fetchResponsableByCi(ci);
    return {
      ...bien,
      responsable: responsable.nombre,
      ciResponsable: responsable.ci_responsable,
    };
  } catch {
    return { ...bien, ciResponsable: ci };
  }
}

export async function fetchApiBienByCodigo(codigo: number): Promise<ApiBien> {
  const res = await apiRequest<ApiItemResponse<ApiBien>>(`/bienes/${codigo}`);
  if (!res.data) throw new Error('Respuesta vacía del API');
  return res.data;
}

export async function fetchBienByCodigo(codigo: number): Promise<BienMueble> {
  const apiBien = await fetchApiBienByCodigo(codigo);
  const almacenesById = await fetchAlmacenesCatalog();
  const bien = mapApiBienToBienMueble(apiBien, almacenesById);
  return enrichBienConResponsable(apiBien, bien);
}

export async function fetchBienesEstadisticas(): Promise<ApiBienesEstadisticas> {
  const res = await apiRequest<ApiItemResponse<ApiBienesEstadisticas>>('/bienes/estadisticas');
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchBienesByAlmacen(idAlmacen: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(
    `/bienes/almacen/${idAlmacen}`
  );

  return mapBienesArray(res.data ?? []);
}

export async function fetchBienesByCategoria(idCategoria: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(
    `/bienes/categoria/${idCategoria}`
  );

  return mapBienesArray(res.data ?? []);
}

export async function fetchBienesByEstadoUso(estadoUso: EstadoUsoBienApi) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(
    `/bienes/estado/${encodeURIComponent(estadoUso)}`
  );

  return mapBienesArray(res.data ?? []);
}

export async function fetchBienBySerial(serial: string): Promise<BienMueble> {
  const res = await apiRequest<ApiItemResponse<ApiBien>>(`/bienes/serial/${encodeURIComponent(serial)}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiBienToBienMueble(res.data);
}

export async function fetchBienesVencidos() {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>('/bienes/vencidos');
  return mapBienesArray(res.data ?? []);
}

export async function createBien(body: BienPayload) {
  const res = await apiRequest<ApiItemResponse<ApiBien>>('/bienes', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiBienToBienMueble(res.data);
}

export async function updateBien(codigo: number, body: BienPayload) {
  const res = await apiRequest<ApiItemResponse<ApiBien>>(`/bienes/${codigo}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiBienToBienMueble(res.data);
}

export async function cambiarEstadoBien(codigo: number, estado_uso: EstadoUsoBienApi) {
  const res = await apiRequest<ApiItemResponse<ApiBien>>(`/bienes/${codigo}/cambiar-estado`, {
    method: 'PATCH',
    body: { estado_uso },
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiBienToBienMueble(res.data);
}

export async function deleteBien(codigo: number) {
  await apiRequest(`/bienes/${codigo}`, { method: 'DELETE' });
}
