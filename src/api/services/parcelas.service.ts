import { apiRequest } from '../client';
import type {
  ApiItemResponse,
  ApiListResponse,
  ApiParcela,
  ApiParcelasEstadisticas,
} from '../types';
import { toIsoDate } from '../mappers/enums';
import {
  mapApiParcelaToTerreno,
  mapApiParcelaToInmueble,
  mapParcelaProtocolos,
} from '../mappers/parcela.mapper';
import { fetchDocumentoPropiedadById } from './documentos-propiedad.service';
import type { Terreno } from '../../types/terreno';
import type { Inmueble } from '../../types/inmueble';
import type { ProtocolizacionTerreno } from '../../types/terreno';
import { fetchAllPages, listParams, metaForAll } from '../pagination';
import { fetchCompromisoById, fetchCompromisosByParcela } from './compromisos.service';
import {
  fetchDesincorporacionById,
  fetchDesincorporacionesByParcela,
} from './desincorporaciones.service';
import { fetchProtocoloById } from './protocolos.service';
import { fetchResponsableByCi } from './responsables.service';
import { fetchUsuarioById } from './usuarios.service';

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
  levantamiento_topografico: 'Si' | 'Solicitar';
  valor_adquisicion?: number | null;
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
  const paging = listParams(query.page, query.limit, 10);
  const res = await apiRequest<ApiListResponse<ApiParcela>>('/parcelas', {
    params: {
      ...paging,
      search: query.search,
      zona: query.zona,
      estado: query.estado,
    },
  });

  return mapParcelasList(res);
}

export async function fetchParcelasAll(query: Omit<ParcelasQuery, 'page' | 'limit'> = {}) {
  const terrenos: Terreno[] = [];
  const inmuebles: Inmueble[] = [];
  const data = await fetchAllPages(async (page, limit) => {
    const pageResult = await fetchParcelas({ ...query, page, limit });
    terrenos.push(...pageResult.terrenos);
    inmuebles.push(...pageResult.inmuebles);
    return { data: pageResult.data, meta: pageResult.meta };
  });
  return { data, terrenos, inmuebles, meta: metaForAll(data) };
}

async function enrichParcelaDocumento(raw: ApiParcela): Promise<ApiParcela> {
  if (!raw.id_documento_propiedad) return raw;
  if (toIsoDate(raw.documento?.fecha_adquisicion)) return raw;

  try {
    const doc = await fetchDocumentoPropiedadById(raw.id_documento_propiedad);
    if (!toIsoDate(doc.fecha_adquisicion)) return raw;

    return {
      ...raw,
      documento: {
        ...raw.documento,
        ...doc,
        propiedad: raw.documento?.propiedad ?? doc.propiedad,
      },
    };
  } catch {
    return raw;
  }
}

async function loadProtocolo(idProtocolo: number) {
  try {
    return await fetchProtocoloById(idProtocolo);
  } catch {
    return undefined;
  }
}

async function enrichMovimientoConProtocolo<
  T extends { id_protocolo: number; protocolo?: { id_protocolo: number } },
>(movimiento: T): Promise<T> {
  if (movimiento.protocolo?.motivo) return movimiento;
  const protocolo = await loadProtocolo(movimiento.id_protocolo);
  return protocolo ? { ...movimiento, protocolo } : movimiento;
}

async function enrichParcelaMovimientos(raw: ApiParcela): Promise<ApiParcela> {
  let compromiso = raw.compromiso;
  let desincorporacion = raw.desincorporacion;

  if (raw.id_comprometida && !compromiso?.protocolo?.motivo) {
    try {
      const found =
        compromiso ??
        (await fetchCompromisosByParcela(raw.id_terreno))[0] ??
        (await fetchCompromisoById(raw.id_comprometida));
      compromiso = await enrichMovimientoConProtocolo(found);
    } catch {
      compromiso = raw.compromiso;
    }
  }

  if (raw.id_desincorporada && !desincorporacion?.protocolo?.motivo) {
    try {
      const found =
        desincorporacion ??
        (await fetchDesincorporacionesByParcela(raw.id_terreno))[0] ??
        (await fetchDesincorporacionById(raw.id_desincorporada));
      desincorporacion = await enrichMovimientoConProtocolo(found);
    } catch {
      desincorporacion = raw.desincorporacion;
    }
  }

  return { ...raw, compromiso, desincorporacion };
}

async function enrichProtocolosBeneficiario(
  protocolos: ProtocolizacionTerreno[],
): Promise<ProtocolizacionTerreno[]> {
  return Promise.all(
    protocolos.map(async (item) => {
      const id = Number(item.beneficiario);
      if (!Number.isFinite(id) || id <= 0) return item;
      try {
        const usuario = await fetchUsuarioById(id);
        return { ...item, beneficiario: usuario.nombre_usuario };
      } catch {
        return item;
      }
    }),
  );
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

  const withDocumento = await enrichParcelaDocumento(res.data);
  const enriched = await enrichParcelaMovimientos(withDocumento);
  const terreno = await enrichTerrenoConResponsable(
    enriched,
    mapApiParcelaToTerreno(enriched),
  );
  const protocolos = await enrichProtocolosBeneficiario(mapParcelaProtocolos(enriched));

  return {
    raw: enriched,
    terreno,
    inmueble: mapApiParcelaToInmueble(enriched),
    protocolos,
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
