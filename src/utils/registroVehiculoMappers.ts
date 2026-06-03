import type {
  CondicionFisicaVehiculoApi,
  EstadoUsoVehiculoApi,
  VehiculoPayload,
} from '../api/services/vehiculos.service';
import type { ItemVehiculoRegistroDraft } from '../types/registroVehiculoItem';
import type { CondicionVehiculo, EstadoUsoVehiculo } from '../types/vehiculo';
import {
  condicionFisicaToApi,
  estadoUsoToApi,
  normalizeCatalogValue,
} from './registroBienMappers';

export function estadoUsoVehiculoToApi(estado: EstadoUsoVehiculo): EstadoUsoVehiculoApi {
  return estadoUsoToApi(estado);
}

export function condicionVehiculoToApi(condicion: CondicionVehiculo): CondicionFisicaVehiculoApi {
  return condicionFisicaToApi(condicion);
}

function descripcionConObservaciones(item: ItemVehiculoRegistroDraft) {
  const base = item.descripcion.trim();
  const obs = item.observaciones.trim();
  if (!obs) return base;
  return `${base}\n[Observaciones]: ${obs}`;
}

export function itemVehiculoToPayload(
  item: ItemVehiculoRegistroDraft,
  params: {
    idDoc: number;
    fechaIngreso: string;
    idAlmacen: number;
  },
): VehiculoPayload {
  return {
    descripcion: descripcionConObservaciones(item),
    id_doc: params.idDoc,
    fecha_egreso: null,
    valor_adquisicion: item.valorAdquisicion,
    marca: item.marca.trim() || null,
    placa: item.placa.trim(),
    anio_fabricacion: item.anioFabricacion,
    modelo: item.modelo.trim() || null,
    color: item.color.trim() || null,
    serial_motor: item.serialMotor.trim() || null,
    serial_carroceria: item.serialCarroceria.trim() || null,
    estado_uso: estadoUsoVehiculoToApi(item.estadoUso),
    condicion_fisica: condicionVehiculoToApi(item.condicionFisica),
    id_categoria_especifica: item.idCategoriaEspecifica,
    estado_vehiculo: 'Carga_Total',
    ci_responsable: item.ciResponsable || null,
    unidad_administrativa: item.unidadAdministrativa,
    id_almacen: params.idAlmacen,
    fecha_ingreso: params.fechaIngreso,
    usuario_carga: null,
  };
}

export function resolveAlmacenIdVehiculo(
  nombre: string,
  almacenes: { id_almacen: number; nombre: string }[],
) {
  const match = almacenes.find(
    (almacen) => normalizeCatalogValue(almacen.nombre) === normalizeCatalogValue(nombre),
  );
  return match?.id_almacen ?? null;
}
