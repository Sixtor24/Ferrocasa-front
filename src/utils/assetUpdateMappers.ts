import type {
  ApiBien,
  ApiVehiculo,
} from '../api/types';
import type {
  BienPayload,
  CondicionFisicaBienApi,
  ConsumibilidadBienApi,
  EstadoUsoBienApi,
} from '../api/services/bienes.service';
import type {
  CondicionFisicaVehiculoApi,
  EstadoUsoVehiculoApi,
  EstadoVehiculoApi,
  VehiculoPayload,
} from '../api/services/vehiculos.service';
import { toIsoDate, toNumber } from '../api/mappers/enums';

/** El API exige string en campos opcionales; null provoca 400 en PUT. */
function stringOrEmpty(value?: string | null) {
  return value?.trim() ?? '';
}

function normalizeEstadoUsoApi(value?: string | null): EstadoUsoBienApi {
  const valid: EstadoUsoBienApi[] = ['En_Uso', 'En_Reparacion', 'Dado_de_Baja', 'Almacenado'];
  if (value && valid.includes(value as EstadoUsoBienApi)) return value as EstadoUsoBienApi;
  return 'En_Uso';
}

function normalizeCondicionFisicaApi(value?: string | null): CondicionFisicaBienApi {
  const valid: CondicionFisicaBienApi[] = ['Bueno', 'Regular', 'Dañado', 'Averiado', 'Inservible'];
  if (value && valid.includes(value as CondicionFisicaBienApi)) return value as CondicionFisicaBienApi;
  return 'Bueno';
}

function normalizeConsumibilidad(value?: string | null): ConsumibilidadBienApi {
  if (value === 'Perecederos') return 'Perecederos';
  return 'No_perecedero';
}

function normalizeEstadoVehiculoApi(value?: string | null): EstadoVehiculoApi {
  const valid: EstadoVehiculoApi[] = [
    'Carga_Parcial',
    'Carga_Total',
    'Disponible',
    'Asignado',
    'En_Mantenimiento',
  ];
  if (value && valid.includes(value as EstadoVehiculoApi)) return value as EstadoVehiculoApi;
  return 'Carga_Total';
}

export function apiBienToUpdatePayload(
  b: ApiBien,
  overrides: Partial<BienPayload> = {},
): BienPayload {
  const serial = b.serial?.trim() ?? '';
  const sinSerial = !serial || serial.toUpperCase() === 'S/S';
  const fechaIngreso = toIsoDate(b.fecha_ingreso) || new Date().toISOString().split('T')[0];

  const base: BienPayload = {
    descripcion: b.descripcion?.trim() ?? '',
    id_doc: b.id_doc ?? 0,
    fecha_ingreso: fechaIngreso,
    fecha_egreso: b.fecha_egreso ? toIsoDate(b.fecha_egreso) || null : undefined,
    valor_adquisicion: toNumber(b.valor_adquisicion) ?? 0,
    marca: stringOrEmpty(b.marca),
    modelo: stringOrEmpty(b.modelo),
    color: stringOrEmpty(b.color),
    material: stringOrEmpty(b.material),
    serial: sinSerial ? 'S/S' : serial,
    estado_uso: normalizeEstadoUsoApi(b.estado_uso),
    condicion_fisica: normalizeCondicionFisicaApi(b.condicion_fisica),
    id_almacen: b.id_almacen,
    cantidad: b.cantidad ?? 1,
    consumibilidad: normalizeConsumibilidad(b.consumibilidad),
    usuario_carga: stringOrEmpty(b.usuario_carga),
    id_categoria_especifica: b.id_categoria_especifica,
    observaciones: stringOrEmpty(b.observaciones),
  };

  return { ...base, ...overrides };
}

export function apiVehiculoToUpdatePayload(
  v: ApiVehiculo,
  overrides: Partial<VehiculoPayload> = {},
): VehiculoPayload {
  const fechaIngreso = toIsoDate(v.fecha_ingreso) || new Date().toISOString().split('T')[0];

  const base: VehiculoPayload = {
    descripcion: v.descripcion?.trim() ?? '',
    id_doc: v.id_doc ?? 0,
    fecha_egreso: v.fecha_egreso ? toIsoDate(v.fecha_egreso) || null : null,
    valor_adquisicion: toNumber(v.valor_adquisicion) ?? 0,
    marca: stringOrEmpty(v.marca),
    placa: v.placa?.trim() || 'S/P',
    anio_fabricacion: v.anio_fabricacion ?? new Date().getFullYear(),
    modelo: stringOrEmpty(v.modelo),
    color: stringOrEmpty(v.color),
    serial_motor: stringOrEmpty(v.serial_motor),
    serial_carroceria: stringOrEmpty(v.serial_carroceria),
    estado_uso: normalizeEstadoUsoApi(v.estado_uso) as EstadoUsoVehiculoApi,
    condicion_fisica: normalizeCondicionFisicaApi(v.condicion_fisica) as CondicionFisicaVehiculoApi,
    id_categoria_especifica: v.id_categoria_especifica,
    estado_vehiculo: normalizeEstadoVehiculoApi(v.estado_vehiculo),
    ci_responsable: stringOrEmpty(v.ci_responsable),
    unidad_administrativa: stringOrEmpty(v.unidad_administrativa),
    id_almacen: v.id_almacen,
    fecha_ingreso: fechaIngreso,
    usuario_carga: stringOrEmpty(v.usuario_carga),
  };

  return { ...base, ...overrides };
}

export function todayIsoDate() {
  return new Date().toISOString().split('T')[0];
}
