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
import { fetchBeneficiarioById } from './beneficiarios.service';
import { fetchResponsableByCi } from './responsables.service';

export type ParcelasQuery = {
  page?: number;
  limit?: number;
  search?: string;
  zona?: string;
  estado?: 'disponible' | 'comprometida' | 'desincorporada';
};

export type ParcelaId = number | string;

function parcelaIdPath(id: ParcelaId): string {
  return encodeURIComponent(String(id));
}

export type ParcelaPayload = {
  /** Identificador alfanumérico de la parcela (ej. TER-PO-001, T-007). */
  id_terreno: string;
  nombre: string;
  zona: string;
  /** El API espera string (p. ej. `"5"` o `"DP-001"`). */
  id_documento_propiedad: string;
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

  const docAnidado = raw.documento;
  const tieneDocumentoCompleto = Boolean(
    docAnidado?.forma_adquisicion
    && (toIsoDate(docAnidado.fecha_adquisicion) || docAnidado.numero_documento)
    && docAnidado.propiedad?.ubicacion,
  );
  if (tieneDocumentoCompleto) return raw;

  try {
    const doc = await fetchDocumentoPropiedadById(raw.id_documento_propiedad);
    return {
      ...raw,
      documento: {
        ...doc,
        ...docAnidado,
        propiedad: docAnidado?.propiedad ?? doc.propiedad,
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
  const parcelaId = raw.codigo?.trim() || String(raw.id_terreno);

  let compromisos: NonNullable<ApiParcela['compromisos']> = [];
  let desincorporaciones: NonNullable<ApiParcela['desincorporaciones']> = [];

  try {
    const [compList, desList] = await Promise.all([
      fetchCompromisosByParcela(parcelaId),
      fetchDesincorporacionesByParcela(parcelaId),
    ]);
    compromisos = await Promise.all(compList.map((item) => enrichMovimientoConProtocolo(item)));
    desincorporaciones = await Promise.all(desList.map((item) => enrichMovimientoConProtocolo(item)));
  } catch {
    compromisos = [];
    desincorporaciones = [];
  }

  if (compromisos.length === 0 && raw.compromiso) {
    compromisos = [await enrichMovimientoConProtocolo(raw.compromiso)];
  } else if (compromisos.length === 0 && raw.id_comprometida) {
    try {
      const found =
        (await fetchCompromisosByParcela(parcelaId))[0]
        ?? (await fetchCompromisoById(Number(raw.id_comprometida)));
      compromisos = [await enrichMovimientoConProtocolo(found)];
    } catch {
      compromisos = raw.compromiso ? [raw.compromiso] : [];
    }
  }

  if (desincorporaciones.length === 0 && raw.desincorporacion) {
    desincorporaciones = [await enrichMovimientoConProtocolo(raw.desincorporacion)];
  } else if (desincorporaciones.length === 0 && raw.id_desincorporada) {
    try {
      const found =
        (await fetchDesincorporacionesByParcela(parcelaId))[0]
        ?? (await fetchDesincorporacionById(Number(raw.id_desincorporada)));
      desincorporaciones = [await enrichMovimientoConProtocolo(found)];
    } catch {
      desincorporaciones = raw.desincorporacion ? [raw.desincorporacion] : [];
    }
  }

  const compromiso = compromisos[compromisos.length - 1] ?? raw.compromiso ?? null;
  const desincorporacion = desincorporaciones[desincorporaciones.length - 1] ?? raw.desincorporacion ?? null;

  return {
    ...raw,
    compromiso,
    desincorporacion,
    compromisos,
    desincorporaciones,
  };
}

async function enrichProtocolosBeneficiario(
  protocolos: ProtocolizacionTerreno[],
): Promise<ProtocolizacionTerreno[]> {
  return Promise.all(
    protocolos.map(async (item) => {
      const ref = item.beneficiario;
      if (!ref || ref === '—') return item;

      try {
        const beneficiario = await fetchBeneficiarioById(ref);
        return { ...item, beneficiario: beneficiario.nombre };
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

export async function fetchParcelaById(id: ParcelaId) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>(`/parcelas/${parcelaIdPath(id)}`);
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
  if (!res.data) throw new Error('Respuesta vacía del API');
  return mapApiParcelaToTerreno(res.data);
}

export async function updateParcela(id: ParcelaId, body: ParcelaPayload) {
  const res = await apiRequest<ApiItemResponse<ApiParcela>>(`/parcelas/${parcelaIdPath(id)}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');
  return mapApiParcelaToTerreno(res.data);
}

export async function deleteParcela(id: ParcelaId) {
  await apiRequest(`/parcelas/${parcelaIdPath(id)}`, { method: 'DELETE' });
}

export type { Terreno, Inmueble };
