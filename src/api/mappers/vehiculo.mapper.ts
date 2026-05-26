import type { Vehiculo } from '../../types/vehiculo';
import type { ApiVehiculo } from '../types';
import {
  mapCondicionVehiculo,
  mapEstadoUsoVehiculo,
  toIsoDate,
  toNumber,
} from './enums';

export function mapApiVehiculoToVehiculo(v: ApiVehiculo): Vehiculo {
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
    almacen: v.almacen?.nombre ?? '—',
    sede: v.almacen?.sede?.nombre ?? '—',
    departamento: v.almacen?.departamento?.nombre ?? v.responsable?.departamento?.nombre ?? '—',
    fechaAdquisicion: toIsoDate(v.documento?.fecha_adquisicion ?? v.fecha_ingreso),
    numeroDocumento: v.documento ? String(v.documento.id_doc) : '—',
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
    documentoAdquisicion: v.documento ? String(v.documento.id_doc) : '—',
    valorAdquisicion: toNumber(v.valor_adquisicion),
    estatusCarga: 'Completo',
    observaciones: v.unidad_administrativa ?? '',
  };
}
