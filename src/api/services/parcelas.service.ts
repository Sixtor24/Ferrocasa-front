import { apiRequest } from '../client';
import type {
  ApiItemResponse,
  ApiListResponse,
  ApiParcela,
  ApiParcelasEstadisticas,
} from '../types';
import {
  mapApiParcelaToTerreno,
  mapApiParcelaToInmueble,
  mapParcelaProtocolos,
} from '../mappers/parcela.mapper';
import type { Terreno } from '../../types/terreno';
import type { Inmueble } from '../../types/inmueble';
import { fetchResponsableByCi } from './responsables.service';

export type ParcelasQuery = {
  page?: number;
  limit?: number;
  search?: string;
  zona?: string;
  estado?: 'disponible' | 'comprometida' | 'desincorporada';
};

export type ParcelaPayload = {
  nombre: string;
  zona: string;
  id_documento_propiedad: number;
  id_desincorporada?: number | null;
  id_comprometida?: number | null;
  ci_responsable: string;
  zonificacion: string;
  observaciones?: string | null;
  acreditacion_ambiental: 'Si_posee' | 'No_posee' | string;
  levantamiento_topografico: 'Si' | 'No' | string;
  ubicacion_adicional?: string | null;
};

function mapParcelasList(res: ApiListResponse<ApiParcela>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    terrenos: rows.map(mapApiParcelaToTerreno),
    inmuebles: rows.map(mapApiParcelaToInmueble),
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapParcelasArray(rows: ApiParcela[]) {
  return {
    data: rows,
    terrenos: rows.map(mapApiParcelaToTerreno),
    inmuebles: rows.map(mapApiParcelaToInmueble),
  };
}

export async function fetchParcelas(query: ParcelasQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiParcela>>('/parcelas', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      zona: query.zona,
      estado: query.estado,
    },
  });

  return mapParcelasList(res);
}

async function enrichTerrenoConResponsable(apiParcela: ApiParcela, terreno: Terreno): Promise<Terreno> {
  if (terreno.responsable !== '—') return terreno;

  const ci = terreno.ciResponsable || apiParcela.ci_responsable;
  if (!ci) return terreno;

  try {
    const responsable = await fetchResponsableByCi(ci);
    return {
      ...terreno,
      responsable: responsable.nombre,
      ciResponsable: responsable.ci_responsable,
    };
  } catch {
    return { ...terreno, ciResponsable: ci };
  }
}

export async function fetchParcelaById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>(`/parcelas/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  const terreno = await enrichTerrenoConResponsable(
    res.data,
    mapApiParcelaToTerreno(res.data),
  );

  return {
    raw: res.data,
    terreno,
    inmueble: mapApiParcelaToInmueble(res.data),
    protocolos: mapParcelaProtocolos(res.data),
  };
}

export async function fetchParcelasEstadisticas(): Promise<ApiParcelasEstadisticas> {
  const res = await apiRequest<ApiItemResponse<ApiParcelasEstadisticas>>('/parcelas/estadisticas');
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchParcelasDisponibles() {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>('/parcelas/disponibles');
  return mapParcelasArray(res.data ?? []);
}

export async function fetchParcelasComprometidas() {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>('/parcelas/comprometidas');
  return mapParcelasArray(res.data ?? []);
}

export async function fetchParcelasDesincorporadas() {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>('/parcelas/desincorporadas');
  return mapParcelasArray(res.data ?? []);
}

export async function searchParcelas(query: Required<Pick<ParcelasQuery, 'search'>> & Pick<ParcelasQuery, 'page' | 'limit'>) {
  const res = await apiRequest<ApiListResponse<ApiParcela>>('/parcelas/buscar', {
    params: {
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    },
  });

  return mapParcelasList(res);
}

export async function fetchParcelasByResponsable(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>(
    `/parcelas/responsable/${encodeURIComponent(ci)}`
  );
  return mapParcelasArray(res.data ?? []);
}

export async function createParcela(body: ParcelaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>('/parcelas', {
    method: 'POST',
    body,
  });
  return mapApiParcelaToTerreno(res.data);
}

export async function updateParcela(id: number, body: ParcelaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>(`/parcelas/${id}`, {
    method: 'PUT',
    body,
  });
  return mapApiParcelaToTerreno(res.data);
}

export async function deleteParcela(id: number) {
  await apiRequest(`/parcelas/${id}`, { method: 'DELETE' });
}

export type { Terreno, Inmueble };
