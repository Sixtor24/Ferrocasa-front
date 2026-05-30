import { apiRequest } from '../client';
import type {
  ApiItemResponse,
  ApiListResponse,
  ApiVehiculo,
  ApiVehiculosEstadisticas,
} from '../types';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';
import type { Vehiculo } from '../../types/vehiculo';

export type VehiculosQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type EstadoUsoVehiculoApi = 'En_Uso' | 'En_Reparacion' | 'Dado_de_Baja' | 'Almacenado';
export type CondicionFisicaVehiculoApi = 'Bueno' | 'Regular' | 'Dañado' | 'Averiado' | 'Inservible';
export type EstadoVehiculoApi = 'Carga_Parcial' | 'Carga_Total' | 'Disponible' | 'Asignado' | 'En_Mantenimiento';

export type VehiculoPayload = {
  descripcion: string;
  id_doc: number;
  fecha_egreso?: string | null;
  valor_adquisicion: number;
  marca?: string | null;
  placa: string;
  anio_fabricacion: number;
  modelo?: string | null;
  color?: string | null;
  serial_motor?: string | null;
  serial_carroceria?: string | null;
  estado_uso: EstadoUsoVehiculoApi;
  condicion_fisica: CondicionFisicaVehiculoApi;
  id_categoria_especifica: number;
  estado_vehiculo: EstadoVehiculoApi;
  ci_responsable?: string | null;
  unidad_administrativa?: string | null;
  id_almacen: number;
  fecha_ingreso: string;
  usuario_carga?: string | null;
};

function mapVehiculosList(res: ApiListResponse<ApiVehiculo>) {
  const rows = res.data ?? [];
  return {
    data: rows.map(mapApiVehiculoToVehiculo),
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapVehiculosArray(rows: ApiVehiculo[]) {
  return rows.map(mapApiVehiculoToVehiculo);
}

export async function fetchVehiculos(query: VehiculosQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiVehiculo>>('/vehiculos', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
    },
  });

  return mapVehiculosList(res);
}

export async function fetchVehiculoById(id: number): Promise<Vehiculo> {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
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

export async function createVehiculo(body: VehiculoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>('/vehiculos', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}

export async function updateVehiculo(codigo: number, body: VehiculoPayload) {
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
  body: { estado_vehiculo: EstadoVehiculoApi; estado_uso: EstadoUsoVehiculoApi }
) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${codigo}/cambiar-estado`, {
    method: 'PATCH',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return mapApiVehiculoToVehiculo(res.data);
}
