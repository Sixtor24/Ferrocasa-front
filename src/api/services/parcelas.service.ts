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

export type ParcelasQuery = {
  page?: number;
  limit?: number;
  search?: string;
  zona?: string;
  estado?: 'disponible' | 'comprometida' | 'desincorporada';
};

export async function fetchParcelas(query: ParcelasQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiParcela>>('/parcelas', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 100,
      search: query.search,
      zona: query.zona,
      estado: query.estado,
    },
  });
  return {
    data: res.data,
    terrenos: res.data.map(mapApiParcelaToTerreno),
    inmuebles: res.data.map(mapApiParcelaToInmueble),
    meta: res.meta,
  };
}

export async function fetchParcelaById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>(`/parcelas/${id}`);
  return {
    raw: res.data,
    terreno: mapApiParcelaToTerreno(res.data),
    inmueble: mapApiParcelaToInmueble(res.data),
    protocolos: mapParcelaProtocolos(res.data),
  };
}

export async function fetchParcelasEstadisticas(): Promise<ApiParcelasEstadisticas> {
  const res = await apiRequest<ApiItemResponse<ApiParcelasEstadisticas>>('/parcelas/estadisticas');
  return res.data;
}

export async function createParcela(body: Record<string, unknown>) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>('/parcelas', {
    method: 'POST',
    body,
  });
  return mapApiParcelaToTerreno(res.data);
}

export type { Terreno, Inmueble };
