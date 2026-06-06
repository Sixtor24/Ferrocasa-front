import type { BienPayload, CondicionFisicaBienApi, EstadoUsoBienApi } from '../api/services/bienes.service';
import type { MonedaDocumento } from '../api/services/documentos.service';
import { fetchResponsableByCi } from '../api/services/responsables.service';
import type { ApiAlmacen, ApiSede } from '../api/types';
import type { ItemRegistroDraft } from '../types/registroBienItem';
import type { CondicionFisica, EstadoUso } from '../types/bien';
import type { MonedaRegistro } from '../types/registroBienItem';

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
  const sinSerial = item.sinSerial || !item.serial.trim() || item.serial.trim().toUpperCase() === 'S/S';

  const observaciones = item.observaciones.trim();

  return {
    descripcion: item.descripcion.trim(),
    id_doc: params.idDoc,
    fecha_ingreso: params.fechaIngreso,
    valor_adquisicion: item.valorAdquisicion,
    marca: item.marca.trim(),
    modelo: item.modelo.trim() || undefined,
    color: item.color.trim() || undefined,
    serial: sinSerial ? 'S/S' : item.serial.trim(),
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
  return almacenes.find((almacen) => normalizeCatalogValue(almacen.nombre) === normalized);
}

export async function resolveResponsableForAlmacen(
  nombreAlmacen: string,
  almacenes: ApiAlmacen[],
): Promise<{ responsable: string; ciResponsable: string }> {
  const match = findAlmacenByNombre(nombreAlmacen, almacenes);
  if (!match) return { responsable: '—', ciResponsable: '' };

  if (match.responsable?.nombre) {
    return {
      responsable: match.responsable.nombre,
      ciResponsable: match.responsable.ci_responsable ?? match.ci_responsable ?? '',
    };
  }

  const ci = match.ci_responsable?.trim();
  if (!ci) return { responsable: '—', ciResponsable: '' };

  try {
    const responsable = await fetchResponsableByCi(ci);
    return { responsable: responsable.nombre, ciResponsable: responsable.ci_responsable };
  } catch {
    return { responsable: '—', ciResponsable: ci };
  }
}
