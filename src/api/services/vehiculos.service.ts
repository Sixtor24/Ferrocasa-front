import { apiRequest } from '../client';
import type {
  ApiItemResponse,
  ApiListResponse,
  ApiVehiculo,
  ApiVehiculosEstadisticas,
} from '../types';
import type { EstadoVehiculoApi } from '../mappers/enums';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';
import { fetchAllPages, listParams, metaForAll } from '../pagination';
import { fetchAlmacenesCatalog } from './almacenes.service';
import { fetchDocumentoById } from './documentos.service';
import { fetchResponsableByCi } from './responsables.service';
import type { Vehiculo } from '../../types/vehiculo';

export type VehiculosQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type EstadoUsoVehiculoApi = 'En_Uso' | 'En_Reparacion' | 'Dado_de_Baja' | 'Almacenado';
export type CondicionFisicaVehiculoApi = 'Bueno' | 'Regular' | 'Dañado';
export type { EstadoVehiculoApi } from '../mappers/enums';

/** Cuerpo POST/PUT /vehiculos según OpenAPI (sin `codigo`; va en la URL en PUT). */
export type VehiculoBody = {
  descripcion?: string;
  id_doc?: number | null;
  fecha_egreso?: string | null;
  valor_adquisicion?: number;
  marca?: string | null;
  placa: string;
  anio_fabricacion?: number;
  modelo?: string | null;
  color?: string | null;
  serial_motor?: string | null;
  serial_carroceria?: string | null;
  estado_uso?: EstadoUsoVehiculoApi;
  condicion_fisica?: CondicionFisicaVehiculoApi;
  id_categoria_especifica: number;
  estado_vehiculo?: EstadoVehiculoApi;
  ci_responsable?: string | null;
  id_almacen: number;
  fecha_ingreso?: string | null;
  usuario_carga?: string | null;
  observaciones?: string | null;
};

async function enrichVehiculosDocumento(rows: ApiVehiculo[]): Promise<ApiVehiculo[]> {
  const ids = [
    ...new Set(
      rows
        .filter((row) => row.id_doc != null && row.id_doc !== '' && !row.documento?.numero_documento?.trim())
        .map((row) => String(row.id_doc)),
    ),
  ];

  if (ids.length === 0) return rows;

  const documentos = await Promise.all(
    ids.map(async (id) => {
      try {
        return { id, doc: await fetchDocumentoById(id) };
      } catch {
        return null;
      }
    }),
  );

  const byId = new Map(
    documentos.filter((entry): entry is { id: string; doc: Awaited<ReturnType<typeof fetchDocumentoById>> } => Boolean(entry))
      .map((entry) => [entry.id, entry.doc]),
  );

  return rows.map((row) => {
    if (row.id_doc == null || row.id_doc === '') return row;
    const doc = byId.get(String(row.id_doc));
    if (!doc) return row;
    return {
      ...row,
      documento: { ...doc, ...row.documento },
    };
  });
}

async function mapVehiculosList(res: ApiListResponse<ApiVehiculo>, almacenesById: Map<number, string>) {
  const rows = await enrichVehiculosDocumento(res.data ?? []);
  return {
    data: rows.map((vehiculo) => mapApiVehiculoToVehiculo(vehiculo, almacenesById)),
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapVehiculosArray(rows: ApiVehiculo[], almacenesById: Map<number, string> = new Map()) {
  return rows.map((vehiculo) => mapApiVehiculoToVehiculo(vehiculo, almacenesById));
}

export async function fetchVehiculos(query: VehiculosQuery = {}) {
  const paging = listParams(query.page, query.limit, 10);
  const [res, almacenesById] = await Promise.all([
    apiRequest<ApiListResponse<ApiVehiculo>>('/vehiculos', {
      params: {
        ...paging,
        search: query.search,
      },
    }),
    fetchAlmacenesCatalog(),
  ]);

  return await mapVehiculosList(res, almacenesById);
}

export async function fetchVehiculosAll(query: Omit<VehiculosQuery, 'page' | 'limit'> = {}) {
  const almacenesById = await fetchAlmacenesCatalog();
  const data = await fetchAllPages(async (page, limit) => {
    const res = await apiRequest<ApiListResponse<ApiVehiculo>>('/vehiculos', {
      params: { page, limit, search: query.search },
    });
    return mapVehiculosList(res, almacenesById);
  });
  return { data, meta: metaForAll(data) };
}

async function enrichVehiculoConResponsable(apiVehiculo: ApiVehiculo, vehiculo: Vehiculo): Promise<Vehiculo> {
  if (vehiculo.responsable !== '—') return vehiculo;

  const ci = vehiculo.ciResponsable || apiVehiculo.ci_responsable;
  if (!ci) return vehiculo;

  try {
    const responsable = await fetchResponsableByCi(ci);
    return {
      ...vehiculo,
      responsable: responsable.nombre,
      ciResponsable: responsable.ci_responsable,
    };
  } catch {
    return { ...vehiculo, ciResponsable: ci };
  }
}

export async function fetchApiVehiculoById(id: number): Promise<ApiVehiculo> {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');
  return res.data;
}

export async function fetchVehiculoById(id: number): Promise<Vehiculo> {
  const [apiVehiculo, almacenesById] = await Promise.all([
    fetchApiVehiculoById(id),
    fetchAlmacenesCatalog(),
  ]);

  const [enriched] = await enrichVehiculosDocumento([apiVehiculo]);
  const vehiculo = mapApiVehiculoToVehiculo(enriched, almacenesById);
  return enrichVehiculoConResponsable(enriched, vehiculo);
}

export async function fetchVehiculosEstadisticas(): Promise<ApiVehiculosEstadisticas> {
  const res = await apiRequest<ApiItemResponse<ApiVehiculosEstadisticas>>('/vehiculos/estadisticas');
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchVehiculosDisponibles() {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>('/vehiculos/disponibles');
  return mapVehiculosArray(res.data ?? []);
}

export async function fetchVehiculosByResponsable(ci: string) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/vehiculos/responsable/${encodeURIComponent(ci)}`
  );

  return mapVehiculosArray(res.data ?? []);
}

export async function fetchVehiculoByPlaca(placa: string): Promise<Vehiculo> {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/placa/${encodeURIComponent(placa)}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}

export async function fetchVehiculosByAlmacen(idAlmacen: number) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/vehiculos/almacen/${idAlmacen}`
  );

  return mapVehiculosArray(res.data ?? []);
}

export async function createVehiculo(body: VehiculoBody) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>('/vehiculos', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}

export async function updateVehiculo(codigo: number, body: VehiculoBody) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${codigo}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}

export async function deleteVehiculo(codigo: number) {
  await apiRequest(`/vehiculos/${codigo}`, { method: 'DELETE' });
}

export async function asignarVehiculo(codigo: number, ci_responsable: string) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${codigo}/asignar`, {
    method: 'PATCH',
    body: { ci_responsable },
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}

export async function cambiarEstadoVehiculo(
  codigo: number,
  body: { estado_vehiculo: EstadoVehiculoApi; estado_uso: EstadoUsoVehiculoApi },
) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${codigo}/cambiar-estado`, {
    method: 'PATCH',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}
