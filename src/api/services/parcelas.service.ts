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
import { allowMockFallback, useMockDataOnly } from '../mockConfig';
import {
  getMockParcelaById,
  getMockParcelas,
  mockParcelasEstadisticas,
} from '../mockResponses';

export type ParcelasQuery = {
  page?: number;
  limit?: number;
  search?: string;
  zona?: string;
  estado?: 'disponible' | 'comprometida' | 'desincorporada';
};

export async function fetchParcelas(query: ParcelasQuery = {}) {
  if (useMockDataOnly()) return getMockParcelas(query);

  try {
    const res = await apiRequest<ApiListResponse<ApiParcela>>('/parcelas', {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 100,
        search: query.search,
        zona: query.zona,
        estado: query.estado,
      },
    });
    const rows = res.data ?? [];
    return {
      data: rows,
      terrenos: rows.map(mapApiParcelaToTerreno),
      inmuebles: rows.map(mapApiParcelaToInmueble),
      meta: res.meta ?? { page: 1, limit: 100, total: rows.length, totalPages: 1 },
    };
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return getMockParcelas(query);
  }
}

export async function fetchParcelaById(id: number) {
  if (useMockDataOnly()) return getMockParcelaById(id);

  try {
    const res = await apiRequest<ApiItemResponse<ApiParcela>>(`/parcelas/${id}`);
    if (!res.data) throw new Error('Respuesta vacía del API');
    return {
      raw: res.data,
      terreno: mapApiParcelaToTerreno(res.data),
      inmueble: mapApiParcelaToInmueble(res.data),
      protocolos: mapParcelaProtocolos(res.data),
    };
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return getMockParcelaById(id);
  }
}

export async function fetchParcelasEstadisticas(): Promise<ApiParcelasEstadisticas> {
  if (useMockDataOnly()) return mockParcelasEstadisticas;

  try {
    const res = await apiRequest<ApiItemResponse<ApiParcelasEstadisticas>>('/parcelas/estadisticas');
    return res.data ?? mockParcelasEstadisticas;
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return mockParcelasEstadisticas;
  }
}

export async function createParcela(body: Record<string, unknown>) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>('/parcelas', {
    method: 'POST',
    body,
  });
  return mapApiParcelaToTerreno(res.data);
}

export type { Terreno, Inmueble };
