import type { BienMueble } from '../../types/bien';
import type { ApiBien } from '../types';
import { resolveAlmacenNombre } from '../utils/almacenLookup';
import {
  isSinCodigoBien,
  isSinSerialBien,
  mapCondicionFisica,
  mapEstadoUsoBien,
  mapFormaAdquisicion,
  mapMoneda,
  toIsoDate,
  toNumber,
} from './enums';

export function mapApiBienToBienMueble(
  b: ApiBien,
  almacenesById: Map<number, string> = new Map(),
): BienMueble {
  const codigo = String(b.codigo_bien);
  const serial = b.serial?.trim() ?? '';
  const sinSerial = isSinSerialBien(serial);

  return {
    id: b.codigo_bien,
    sede: b.almacen?.sede?.nombre ?? '—',
    unidadAdministrativa: b.unidad_administrativa ?? b.almacen?.departamento?.nombre ?? '—',
    responsable: b.almacen?.responsable?.nombre ?? '—',
    ciResponsable: b.almacen?.ci_responsable ?? b.almacen?.responsable?.ci_responsable ?? '',
    codigoInterno: codigo,
    sinCodigo: isSinCodigoBien(codigo),
    descripcion: b.descripcion ?? '—',
    formaAdquisicion: mapFormaAdquisicion(b.documento?.forma_adquisicion),
    fechaAdquisicion: toIsoDate(b.documento?.fecha_adquisicion ?? b.fecha_ingreso),
    fechaIngreso: toIsoDate(b.fecha_ingreso),
    numeroDocumento: b.documento?.numero_documento?.trim() || (b.documento ? String(b.documento.id_doc) : '—'),
    nombreProveedor: b.documento?.nombre_proveedor?.trim() || '—',
    moneda: mapMoneda(b.documento?.moneda),
    valorAdquisicion: toNumber(b.valor_adquisicion),
    estadoUso: mapEstadoUsoBien(b.estado_uso),
    condicionFisica: mapCondicionFisica(b.condicion_fisica),
    marca: b.marca ?? '—',
    modelo: b.modelo ?? '',
    color: b.color ?? '',
    serial: sinSerial ? 'S/S' : serial,
    sinSerial,
    categoriaGeneral: b.categoria?.subcategoria?.categoria_general?.nombre ?? '—',
    subcategoria: b.categoria?.subcategoria?.nombre ?? '—',
    categoriaEspecifica: b.categoria?.nombre ?? '—',
    codigoCategoria: String(b.id_categoria_especifica),
    ubicacion: resolveAlmacenNombre(b.id_almacen, b.almacen?.nombre, almacenesById),
    cantidad: b.cantidad ?? null,
    consumibilidad:
      b.consumibilidad === 'No_perecedero'
        ? 'No perecedero'
        : b.consumibilidad === 'Perecederos'
          ? 'Perecederos'
          : (b.consumibilidad?.replace(/_/g, ' ') ?? '—'),
    fuenteRegistro: 'API',
    estatusCarga: 'Completo',
    observaciones: b.observaciones?.trim() ?? '',
    creadoEn: toIsoDate(b.fecha_ingreso) || new Date().toISOString().split('T')[0],
    actualizadoEn: toIsoDate(b.fecha_ingreso) || new Date().toISOString().split('T')[0],
  };
}
