import type { BienMueble } from '../types/bien';
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

function fechaInterno(fecha: string) {
  if (!fecha || fecha === '—') return '';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formato interno administrativo (11 columnas con logo institucional). */
export function bienToInternoAdministrativoRow(bien: BienMueble): (string | number)[] {
  return [
    bien.sinCodigo ? 'S/C' : bien.codigoInterno,
    dashToEmpty(bien.descripcion),
    marcaInterno(bien.marca),
    modeloInterno(bien.modelo),
    bien.color?.trim() || '',
    serialInternoBien(bien),
    fechaInterno(bien.fechaAdquisicion || bien.fechaIngreso),
    dashToEmpty(bien.sede),
    dashToEmpty(bien.ubicacion),
    bien.estadoUso,
    dashToEmpty(bien.observaciones),
  ];
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

/** Formato interno inventario vehículos y maquinaria (12 columnas con logo institucional). */
export function vehiculoToInternoInventarioRow(vehiculo: Vehiculo): (string | number)[] {
  return [
    vehiculo.codigoInterno,
    dashToEmpty(vehiculo.descripcion),
    vehiculo.sinPlaca ? 'S/P' : dashToEmpty(vehiculo.placa),
    marcaInterno(vehiculo.marca),
    modeloInterno(vehiculo.modelo),
    dashToEmpty(vehiculo.color),
    dashToEmpty(vehiculo.almacen),
    dashToEmpty(vehiculo.sede),
    fechaInterno(vehiculo.fechaAdquisicion || vehiculo.fechaIngreso),
    vehiculo.estadoUso,
    vehiculo.condicionFisica,
    dashToEmpty(vehiculo.observaciones),
  ];
}
