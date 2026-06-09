import type { BienPayload, CondicionFisicaBienApi, EstadoUsoBienApi } from '../api/services/bienes.service';
import type { MonedaDocumento } from '../api/services/documentos.service';
import { fetchResponsableByCi } from '../api/services/responsables.service';
import type { ApiAlmacen, ApiSede } from '../api/types';
import type { ItemRegistroDraft } from '../types/registroBienItem';
import type { CondicionFisica, EstadoUso } from '../types/bien';
import type { MonedaRegistro } from '../types/registroBienItem';
import { isSinSerialBien, serialBienToApi } from './serialBien';
import { ciResponsableForApi } from './vehiculoApiFields';

export function monedaBienToDocumento(moneda: MonedaRegistro): MonedaDocumento {
  if (moneda === 'USD') return 'USD';
  if (moneda === 'EUR') return 'EUR';
  return 'VES';
}

export function estadoUsoToApi(estado: EstadoUso): EstadoUsoBienApi {
  if (estado === 'En uso') return 'En_Uso';
  if (estado === 'En obsolescencia') return 'En_Reparacion';
  if (estado === 'Obsoleto') return 'Dado_de_Baja';
  return 'En_Uso';
}

export function condicionFisicaToApi(condicion: CondicionFisica): CondicionFisicaBienApi {
  if (condicion === 'Regular') return 'Regular';
  if (condicion === 'Dañado') return 'Dañado';
  return 'Bueno';
}

export function itemRegistroToBienPayload(
  item: ItemRegistroDraft,
  params: { idDoc: number; fechaIngreso: string; idAlmacen: number },
): BienPayload {
  const sinSerial = item.sinSerial || isSinSerialBien(item.serial);
  const codigoBien = item.codigoInterno.trim();

  const observaciones = item.observaciones.trim();

  return {
    codigo_bien: codigoBien,
    descripcion: item.descripcion.trim(),
    id_doc: params.idDoc,
    fecha_ingreso: params.fechaIngreso,
    valor_adquisicion: item.valorAdquisicion,
    marca: item.marca.trim(),
    modelo: item.modelo.trim() || undefined,
    color: item.color.trim() || undefined,
    serial: serialBienToApi(item.serial, codigoBien, { sinSerial }),
    estado_uso: estadoUsoToApi(item.estadoUso),
    condicion_fisica: condicionFisicaToApi(item.condicionFisica),
    id_almacen: params.idAlmacen,
    cantidad: item.cantidad,
    consumibilidad: item.consumibilidad,
    id_categoria_especifica: item.idCategoriaEspecifica,
    ...(observaciones ? { observaciones } : {}),
  };
}

export function normalizeCatalogValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveSedeId(nombreSede: string, sedes: ApiSede[]): number | null {
  const normalized = normalizeCatalogValue(nombreSede);
  const exact = sedes.find((sede) => normalizeCatalogValue(sede.nombre) === normalized);
  if (exact) return exact.id_sede;

  const partial = sedes.find((sede) => {
    const apiName = normalizeCatalogValue(sede.nombre);
    return apiName.includes(normalized) || normalized.includes(apiName);
  });
  return partial?.id_sede ?? null;
}

export function findAlmacenByNombre(nombre: string, almacenes: ApiAlmacen[]) {
  const normalized = normalizeCatalogValue(nombre);
  const exact = almacenes.find((almacen) => normalizeCatalogValue(almacen.nombre) === normalized);
  if (exact) return exact;

  return almacenes.find((almacen) => {
    const apiName = normalizeCatalogValue(almacen.nombre);
    return apiName.includes(normalized) || normalized.includes(apiName);
  });
}

export function almacenNombresPorSede(
  almacenes: ApiAlmacen[],
  sede: string,
  sedes: ApiSede[],
  catalogFallback: readonly string[],
): string[] {
  const idSede = resolveSedeId(sede, sedes);
  const fromApi = almacenes
    .filter((almacen) => (idSede ? almacen.id_sede === idSede : true))
    .map((almacen) => almacen.nombre)
    .filter((nombre): nombre is string => Boolean(nombre?.trim()));

  if (fromApi.length > 0) {
    return [...new Set(fromApi)].sort((a, b) => a.localeCompare(b, 'es'));
  }

  const catalogNames = new Set(catalogFallback.map(normalizeCatalogValue));
  const fromCatalog = almacenes
    .map((almacen) => almacen.nombre)
    .filter((nombre) => catalogNames.has(normalizeCatalogValue(nombre)));
  if (fromCatalog.length > 0) return fromCatalog;

  return [...catalogFallback];
}

export async function resolveResponsableForAlmacen(
  nombreAlmacen: string,
  almacenes: ApiAlmacen[],
): Promise<{ responsable: string; ciResponsable: string }> {
  const match = findAlmacenByNombre(nombreAlmacen, almacenes);
  if (!match) return { responsable: '—', ciResponsable: '' };

  if (match.responsable?.nombre) {
    const ci = ciResponsableForApi(match.responsable.ci_responsable ?? match.ci_responsable);
    if (ci) {
      return {
        responsable: match.responsable.nombre,
        ciResponsable: ci,
      };
    }
  }

  const ci = ciResponsableForApi(match.ci_responsable);
  if (!ci) return { responsable: '—', ciResponsable: '' };

  try {
    const responsable = await fetchResponsableByCi(ci);
    const ciNormalizado = ciResponsableForApi(responsable.ci_responsable) ?? ci;
    return {
      responsable: responsable.nombre,
      ciResponsable: ciNormalizado,
    };
  } catch {
    return { responsable: '—', ciResponsable: '' };
  }
}
