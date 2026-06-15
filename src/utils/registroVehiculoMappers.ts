import type {
  CondicionFisicaVehiculoApi,
  EstadoUsoVehiculoApi,
  VehiculoCreateBody,
} from '../api/services/vehiculos.service';
import { toApiDateTime } from '../api/mappers/enums';
import type { ItemVehiculoRegistroDraft } from '../types/registroVehiculoItem';
import type { CondicionVehiculo, EstadoUsoVehiculo } from '../types/vehiculo';
import type {
  DocumentoVehiculoPayload,
  FormaAdquisicionDocumento,
  MonedaDocumento,
} from '../api/services/documentos.service';
import {
  condicionFisicaToApi,
  estadoUsoToApi,
  normalizeCatalogValue,
} from './registroBienMappers';
import {
  apiStringField,
  ciResponsableForApi,
  entityIdForApi,
  usuarioCargaForApi,
  vehiculoCodigoForApi,
  vehiculoSerialCreateForApi,
} from './vehiculoApiFields';
import { buildVehiculoObservacionesMeta } from './vehiculoObservacionesMeta';

export function buildDocumentoVehiculoPayload(input: {
  numeroDocumento: string;
  nombreProveedor: string;
  formaAdquisicion: FormaAdquisicionDocumento;
  fechaAdquisicion?: string | null;
  moneda: MonedaDocumento;
}): DocumentoVehiculoPayload {
  const id_doc = input.numeroDocumento.trim();
  if (!id_doc) {
    throw new Error('Indique el nro de documento');
  }

  return {
    id_doc,
    nombre_proveedor: input.nombreProveedor.trim(),
    forma_adquisicion: input.formaAdquisicion,
    fecha_adquisicion: input.fechaAdquisicion ?? null,
    moneda: input.moneda,
  };
}

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
    idDoc: string;
    fechaIngreso: string;
    idAlmacen: number;
    numeroDocumento?: string;
  },
): VehiculoCreateBody {
  const notas = buildVehiculoObservacionesMeta(item.observaciones, {
    unidadAdministrativa: item.unidadAdministrativa,
    numeroDocumento: params.numeroDocumento,
  });
  const ci = ciResponsableForApi(item.ciResponsable);
  const codigo = vehiculoCodigoForApi(item.codigoInterno);

  return {
    codigo,
    descripcion: item.descripcion.trim(),
    id_doc: entityIdForApi(params.idDoc),
    fecha_egreso: null,
    valor_adquisicion: item.valorAdquisicion,
    marca: apiStringField(item.marca),
    placa: item.placa.trim(),
    anio_fabricacion: item.anioFabricacion,
    modelo: apiStringField(item.modelo),
    color: apiStringField(item.color),
    serial_motor: vehiculoSerialCreateForApi(item.serialMotor, 'motor', codigo),
    serial_carroceria: vehiculoSerialCreateForApi(item.serialCarroceria, 'carroceria', codigo),
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
