import type { BienMueble } from '../types/bien';
import type { Terreno } from '../types/terreno';
import type { Vehiculo } from '../types/vehiculo';
import { sudebipEstadoUso } from './sudebipExportMappers';

function dashToEmpty(value: string) {
  return value === '—' ? '' : value;
}

function marcaInterno(marca: string) {
  const value = dashToEmpty(marca);
  return value || 'S/M';
}

function modeloInterno(modelo: string) {
  return modelo?.trim() || 'S/M';
}

function serialInternoBien(bien: BienMueble) {
  return bien.sinSerial ? 'S/S' : bien.serial || 'S/S';
}

/** Estado para inventario administrativo (columna ESTADO DEL BIEN). */
function estadoInternoAlmacen(bien: BienMueble) {
  return sudebipEstadoUso(bien.estadoUso);
}

/** Estado para área patio cementerio (BUENO, DAÑADO, OPERATIVO…). */
function estadoInternoCementerio(bien: BienMueble) {
  if (bien.estadoUso === 'Obsoleto') return 'DAÑADO';
  if (bien.condicionFisica === 'Bueno') return 'BUENO';
  if (bien.condicionFisica === 'Dañado' || bien.condicionFisica === 'Averiado') return 'DAÑADO';
  if (bien.estadoUso === 'En uso') return 'OPERATIVO';
  return bien.condicionFisica.toUpperCase();
}

export function bienToInternoMueblesRow(
  bien: BienMueble,
  modo: 'almacen' | 'cementerio' = 'almacen',
): (string | number)[] {
  return [
    bien.sinCodigo ? 'S/C' : bien.codigoInterno,
    dashToEmpty(bien.descripcion),
    marcaInterno(bien.marca),
    modeloInterno(bien.modelo),
    bien.color?.trim() || '',
    serialInternoBien(bien),
    modo === 'cementerio' ? estadoInternoCementerio(bien) : estadoInternoAlmacen(bien),
  ];
}

export function vehiculoToInternoMueblesRow(vehiculo: Vehiculo): (string | number)[] {
  const serial = vehiculo.sinSerialCarroceria
    ? vehiculo.sinSerialMotor
      ? vehiculo.sinPlaca
        ? 'S/P'
        : vehiculo.placa
      : vehiculo.serialMotor
    : vehiculo.serialCarroceria;

  return [
    vehiculo.codigoInterno,
    dashToEmpty(vehiculo.descripcion),
    marcaInterno(vehiculo.marca),
    modeloInterno(vehiculo.modelo),
    dashToEmpty(vehiculo.color),
    serial || 'S/S',
    sudebipEstadoUso(vehiculo.estadoUso),
  ];
}

export function terrenoToInternoParcelaRow(index: number, terreno: Terreno): (string | number)[] {
  return [
    index + 1,
    dashToEmpty(terreno.ubicacion) || dashToEmpty(terreno.zona),
    terreno.areaDocumento ?? terreno.areaTotalM2 ?? 0,
    terreno.areaDesincorporada ?? 0,
    terreno.areaComprometida ?? 0,
    terreno.areaDisponible ?? 0,
    dashToEmpty(terreno.identificacion) || dashToEmpty(terreno.nombre),
    dashToEmpty(terreno.zonificacion),
    dashToEmpty(terreno.observacion),
  ];
}
