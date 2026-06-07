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
  VehiculoBody,
} from '../api/services/vehiculos.service';
import {
  normalizeEstadoVehiculoApi,
  toApiDateTime,
  toIsoDate,
  toNumber,
} from '../api/mappers/enums';
import { isSinSerialBien, serialBienToApi } from './serialBien';
import {
  apiStringField,
  ciResponsableForApi,
  usuarioCargaForApi,
} from './vehiculoApiFields';

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

function normalizeCondicionVehiculoApi(value?: string | null): CondicionFisicaVehiculoApi {
  if (value === 'Regular') return 'Regular';
  if (value === 'Dañado' || value === 'Averiado' || value === 'Inservible') return 'Dañado';
  return 'Bueno';
}

function normalizeConsumibilidad(value?: string | null): ConsumibilidadBienApi {
  if (value === 'Perecederos') return 'Perecederos';
  return 'No_perecedero';
}

export function apiBienToUpdatePayload(
  b: ApiBien,
  overrides: Partial<BienPayload> = {},
): BienPayload {
  const serial = b.serial?.trim() ?? '';
  const codigoBien = String(b.codigo_bien);
  const sinSerial = isSinSerialBien(serial);
  const fechaIngreso = toIsoDate(b.fecha_ingreso) || new Date().toISOString().split('T')[0];

  const base: BienPayload = {
    codigo_bien: codigoBien,
    descripcion: b.descripcion?.trim() ?? '',
    id_doc: b.id_doc ?? 0,
    fecha_ingreso: fechaIngreso,
    fecha_egreso: b.fecha_egreso ? toIsoDate(b.fecha_egreso) || null : undefined,
    valor_adquisicion: toNumber(b.valor_adquisicion) ?? 0,
    marca: stringOrEmpty(b.marca),
    modelo: stringOrEmpty(b.modelo),
    color: stringOrEmpty(b.color),
    material: stringOrEmpty(b.material),
    serial: serialBienToApi(serial, codigoBien, { sinSerial }),
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
  overrides: Partial<VehiculoBody> = {},
): VehiculoBody {
  const fechaIngreso = toApiDateTime(v.fecha_ingreso) ?? toApiDateTime(new Date().toISOString());

  const ci = ciResponsableForApi(v.ci_responsable);

  const base: VehiculoBody = {
    descripcion: v.descripcion?.trim() ?? '',
    id_doc: v.id_doc ?? null,
    fecha_egreso: v.fecha_egreso ? toApiDateTime(v.fecha_egreso) ?? null : null,
    valor_adquisicion: toNumber(v.valor_adquisicion) ?? 0,
    marca: apiStringField(v.marca),
    placa: v.placa?.trim() || 'S/P',
    anio_fabricacion: v.anio_fabricacion ?? new Date().getFullYear(),
    modelo: apiStringField(v.modelo),
    color: apiStringField(v.color),
    serial_motor: apiStringField(v.serial_motor) || 'S/S',
    serial_carroceria: apiStringField(v.serial_carroceria),
    estado_uso: normalizeEstadoUsoApi(v.estado_uso) as EstadoUsoVehiculoApi,
    condicion_fisica: normalizeCondicionVehiculoApi(v.condicion_fisica),
    id_categoria_especifica: v.id_categoria_especifica,
    estado_vehiculo: normalizeEstadoVehiculoApi(v.estado_vehiculo),
    id_almacen: v.id_almacen,
    fecha_ingreso: fechaIngreso,
    usuario_carga: apiStringField(v.usuario_carga) || usuarioCargaForApi(),
    observaciones: apiStringField(v.observaciones),
    ...(ci ? { ci_responsable: ci } : {}),
  };

  const merged = { ...base, ...overrides };
  if ('ci_responsable' in overrides) {
    const overrideCi = ciResponsableForApi(overrides.ci_responsable);
    if (overrideCi) merged.ci_responsable = overrideCi;
    else delete merged.ci_responsable;
  }

  return merged;
}

export function todayIsoDate() {
  return toApiDateTime(new Date().toISOString()) ?? new Date().toISOString();
}
