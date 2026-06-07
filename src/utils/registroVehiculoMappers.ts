import type {
  CondicionFisicaVehiculoApi,
  EstadoUsoVehiculoApi,
  VehiculoBody,
} from '../api/services/vehiculos.service';
import { toApiDateTime } from '../api/mappers/enums';
import type { ItemVehiculoRegistroDraft } from '../types/registroVehiculoItem';
import type { CondicionVehiculo, EstadoUsoVehiculo } from '../types/vehiculo';
import {
  condicionFisicaToApi,
  estadoUsoToApi,
  normalizeCatalogValue,
} from './registroBienMappers';
import {
  apiStringField,
  ciResponsableForApi,
  usuarioCargaForApi,
} from './vehiculoApiFields';

export function estadoUsoVehiculoToApi(estado: EstadoUsoVehiculo): EstadoUsoVehiculoApi {
  return estadoUsoToApi(estado);
}

export function condicionVehiculoToApi(condicion: CondicionVehiculo): CondicionFisicaVehiculoApi {
  if (condicion === 'Regular') return 'Regular';
  if (condicion === 'Dañado') return 'Dañado';
  return 'Bueno';
}

export function itemVehiculoToPayload(
  item: ItemVehiculoRegistroDraft,
  params: {
    idDoc: number;
    fechaIngreso: string;
    idAlmacen: number;
  },
): VehiculoBody {
  const observaciones = item.observaciones.trim();
  const unidad = item.unidadAdministrativa.trim();
  const notas = [observaciones, unidad ? `[unidad:${unidad}]` : ''].filter(Boolean).join(' ').trim();
  const ci = ciResponsableForApi(item.ciResponsable);

  return {
    descripcion: item.descripcion.trim(),
    id_doc: params.idDoc,
    fecha_egreso: null,
    valor_adquisicion: item.valorAdquisicion,
    marca: apiStringField(item.marca),
    placa: item.placa.trim(),
    anio_fabricacion: item.anioFabricacion,
    modelo: apiStringField(item.modelo),
    color: apiStringField(item.color),
    serial_motor: apiStringField(item.serialMotor) || 'S/S',
    serial_carroceria: apiStringField(item.serialCarroceria),
    estado_uso: estadoUsoVehiculoToApi(item.estadoUso),
    condicion_fisica: condicionVehiculoToApi(item.condicionFisica),
    id_categoria_especifica: item.idCategoriaEspecifica,
    estado_vehiculo: 'Carga_Completa',
    id_almacen: params.idAlmacen,
    fecha_ingreso: toApiDateTime(params.fechaIngreso),
    usuario_carga: usuarioCargaForApi(),
    ...(ci ? { ci_responsable: ci } : {}),
    ...(notas ? { observaciones: notas } : {}),
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
