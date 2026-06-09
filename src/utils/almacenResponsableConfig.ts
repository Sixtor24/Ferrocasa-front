import { updateAlmacen } from '../api/services/almacenes.service';
import {
  createDepartamento,
  fetchDepartamentosBySede,
} from '../api/services/departamentos.service';
import {
  createResponsable,
  fetchResponsableByCi,
  updateResponsable,
} from '../api/services/responsables.service';
import type { ApiAlmacen, ApiDepartamento } from '../api/types';
import { normalizeCatalogValue } from './registroBienMappers';
import { parseCiResponsableForApi } from './vehiculoApiFields';

export type AlmacenResponsableConfigInput = {
  almacen: ApiAlmacen;
  nombreResponsable: string;
  ciResponsable: string;
  departamentoNombre: string;
};

function findDepartamentoByNombre(
  nombre: string,
  idSede: number,
  departamentos: ApiDepartamento[],
): ApiDepartamento | undefined {
  const normalized = normalizeCatalogValue(nombre);
  return departamentos.find(
    (departamento) =>
      departamento.id_sede === idSede
      && normalizeCatalogValue(departamento.nombre) === normalized,
  );
}

async function resolveDepartamentoId(
  nombre: string,
  idSede: number,
  departamentos: ApiDepartamento[],
): Promise<number> {
  const trimmed = nombre.trim();
  if (!trimmed) {
    throw new Error('Indique el departamento del responsable');
  }

  const existing = findDepartamentoByNombre(trimmed, idSede, departamentos);
  if (existing) return existing.id_departamento;

  const sedeDepartamentos = await fetchDepartamentosBySede(idSede);
  const fromApi = findDepartamentoByNombre(trimmed, idSede, sedeDepartamentos);
  if (fromApi) return fromApi.id_departamento;

  try {
    const created = await createDepartamento({ nombre: trimmed, id_sede: idSede });
    return created.id_departamento;
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    const alreadyExists = message.includes('existe') || message.includes('duplicate') || message.includes('409');
    if (!alreadyExists) throw err;

    const refreshed = await fetchDepartamentosBySede(idSede);
    const retry = findDepartamentoByNombre(trimmed, idSede, refreshed);
    if (retry) return retry.id_departamento;
    throw err;
  }
}

async function upsertResponsable(
  ciRaw: string,
  nombre: string,
  idDepartamento: number,
): Promise<string> {
  const ci = parseCiResponsableForApi(ciRaw);

  try {
    await fetchResponsableByCi(ci);
    await updateResponsable(ci, { nombre, id_departamento: idDepartamento });
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    const notFound = message.includes('404') || message.includes('no encontr');
    if (!notFound) throw err;
    await createResponsable({
      ci_responsable: ci,
      nombre,
      id_departamento: idDepartamento,
    });
  }

  return ci;
}

export async function saveAlmacenResponsableConfig(
  input: AlmacenResponsableConfigInput,
  departamentos: ApiDepartamento[],
): Promise<ApiAlmacen> {
  const nombre = input.nombreResponsable.trim();
  const idSede = input.almacen.id_sede ?? input.almacen.sede?.id_sede;

  if (!nombre) throw new Error('Indique el nombre del responsable');
  if (!input.ciResponsable.trim()) throw new Error('Indique la cédula del responsable');
  if (!idSede) throw new Error('El almacén seleccionado no tiene sede asociada');

  const idDepartamento = await resolveDepartamentoId(
    input.departamentoNombre,
    idSede,
    departamentos,
  );

  const ci = await upsertResponsable(input.ciResponsable, nombre, idDepartamento);

  return updateAlmacen(input.almacen.id_almacen, {
    nombre: input.almacen.nombre,
    id_sede: idSede,
    ci_responsable: ci,
    id_departamento: idDepartamento,
  });
}

export function almacenResponsableLabel(almacen: ApiAlmacen): string {
  const sede = almacen.sede?.nombre ?? `Sede ${almacen.id_sede ?? '—'}`;
  return `${sede} — ${almacen.nombre}`;
}
