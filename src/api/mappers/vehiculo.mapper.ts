import type { Vehiculo } from '../../types/vehiculo';
import type { ApiVehiculo } from '../types';
import { resolveAlmacenNombre } from '../utils/almacenLookup';

const UNIDAD_META_RE = /\[unidad:([^\]]+)\]/i;

function extractUnidadMeta(observaciones?: string | null): string {
  const match = observaciones?.match(UNIDAD_META_RE);
  return match?.[1]?.trim() ?? '';
}

function stripVehiculoObservacionesMeta(observaciones?: string | null): string {
  return (observaciones ?? '').replace(UNIDAD_META_RE, '').trim();
}
import {
  mapCondicionVehiculo,
  mapEstadoUsoVehiculo,
  mapFormaAdquisicion,
  mapMoneda,
  toIsoDate,
  toNumber,
} from './enums';

export function mapApiVehiculoToVehiculo(
  v: ApiVehiculo,
  almacenesById: Map<number, string> = new Map(),
): Vehiculo {
  const placa = v.placa?.trim() ?? '';
  const sinPlaca = !placa || placa === 'S/P';
  const serialMotor = v.serial_motor?.trim() ?? '';
  const serialCarroceria = v.serial_carroceria?.trim() ?? '';

  return {
    id: v.codigo,
    codigoInterno: String(v.codigo),
    descripcion: v.descripcion ?? '—',
    marca: v.marca ?? '—',
    modelo: v.modelo ?? '—',
    color: v.color ?? '—',
    almacen: resolveAlmacenNombre(v.id_almacen, v.almacen?.nombre, almacenesById),
    sede: v.almacen?.sede?.nombre ?? '—',
    unidadAdministrativa:
      v.unidad_administrativa
      ?? extractUnidadMeta(v.observaciones)
      ?? v.responsable?.departamento?.nombre
      ?? '—',
    responsable: v.responsable?.nombre ?? '—',
    ciResponsable: v.ci_responsable ?? v.responsable?.ci_responsable ?? '',
    proveedor: v.documento?.nombre_proveedor ?? '—',
    moneda: mapMoneda(v.documento?.moneda),
    fechaIngreso: toIsoDate(v.fecha_ingreso) || '—',
    fechaAdquisicion: toIsoDate(v.documento?.fecha_adquisicion) || '—',
    numeroDocumento: v.documento?.numero_documento?.trim() || (v.documento ? String(v.documento.id_doc) : '—'),
    anioFabricacion: v.anio_fabricacion ?? null,
    serialMotor: serialMotor || 'S/S',
    sinSerialMotor: !serialMotor,
    serialCarroceria,
    sinSerialCarroceria: !serialCarroceria,
    placa: sinPlaca ? 'S/P' : placa,
    sinPlaca,
    condicionFisica: mapCondicionVehiculo(v.condicion_fisica),
    estadoUso: mapEstadoUsoVehiculo(v.estado_uso),
    categoriaGeneral: v.categoria?.subcategoria?.categoria_general?.nombre ?? '—',
    subcategoria: v.categoria?.subcategoria?.nombre ?? '—',
    categoriaEspecifica: v.categoria?.nombre ?? '—',
    codigoCategoria: String(v.id_categoria_especifica),
    formaAdquisicion: mapFormaAdquisicion(v.documento?.forma_adquisicion),
    documentoAdquisicion: v.documento ? String(v.documento.id_doc) : '—',
    valorAdquisicion: toNumber(v.valor_adquisicion),
    estatusCarga: 'Completo',
    observaciones: stripVehiculoObservacionesMeta(v.observaciones),
  };
}
