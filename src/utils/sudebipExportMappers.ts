import type { BienMueble, EstatusCarga, FormaAdquisicion, MonedaBien } from '../types/bien';
import type { EstatusCargaVehiculo, Vehiculo } from '../types/vehiculo';

function dashToEmpty(value: string) {
  return value === '—' ? '' : value;
}

export function sudebipFecha(iso: string): string {
  if (!iso || iso === '—') return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function sudebipFechaEmision(fecha = new Date(), rol?: string): string {
  const fechaTexto = fecha.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const rolLabel = rol?.trim() || 'Usuario';
  return `Rol: ${rolLabel} | Fecha de emisión: ${fechaTexto}`;
}

export function formaAdquisicionSudebip(forma: FormaAdquisicion | string): string {
  const map: Record<string, string> = {
    Compra: 'COMPRA',
    Donación: 'DONACIÓN',
    Transferencia: 'TRANSFERENCIA',
    Asignación: 'ASIGNACIÓN',
    Comodato: 'COMODATO',
    Confiscación: 'CONFISCACIÓN',
    Desconocida: '',
  };
  return map[forma] ?? String(forma).toUpperCase();
}

export function sudebipMoneda(moneda: MonedaBien): string {
  if (moneda === 'USD') return 'Dólar';
  if (moneda === 'EUR') return 'Euro';
  return 'Bolívar Digital';
}

export function sudebipValor(valor: number | null): string | number {
  if (valor === null || !Number.isFinite(valor)) return '';
  return String(valor).replace('.', ',');
}

export function sudebipEstadoUso(estado: string): string {
  if (estado === 'En uso') return 'EN USO';
  if (estado === 'En obsolescencia') return 'EN OBSOLESCENCIA';
  if (estado === 'Obsoleto') return 'OBSOLETO';
  return estado.toUpperCase();
}

export function sudebipEstatusCarga(estatus: EstatusCarga | EstatusCargaVehiculo): string {
  if (estatus === 'Completo') return 'Carga Total';
  if (estatus === 'Parcial') return 'Carga Parcial';
  if (estatus === 'Pendiente') return 'Carga Pendiente';
  return 'Carga Parcial';
}

export function bienToSudebipReportRow(index: number, bien: BienMueble): (string | number)[] {
  return [
    index + 1,
    dashToEmpty(bien.sede),
    dashToEmpty(bien.unidadAdministrativa),
    bien.sinCodigo ? 'S/C' : bien.codigoInterno,
    dashToEmpty(bien.descripcion),
    formaAdquisicionSudebip(bien.formaAdquisicion),
    sudebipFecha(bien.fechaAdquisicion),
    dashToEmpty(bien.numeroDocumento),
    sudebipMoneda(bien.moneda),
    sudebipValor(bien.valorAdquisicion),
    bien.condicionFisica.toUpperCase(),
    sudebipEstadoUso(bien.estadoUso),
    dashToEmpty(bien.marca) || 'S/M',
    bien.modelo?.trim() || 'S/M',
    bien.color?.trim() || '',
    bien.sinSerial ? 'S/S' : bien.serial || 'S/S',
    dashToEmpty(bien.categoriaGeneral),
    dashToEmpty(bien.subcategoria),
    dashToEmpty(bien.categoriaEspecifica),
    bien.codigoCategoria ? Number(bien.codigoCategoria) || bien.codigoCategoria : '',
    sudebipEstatusCarga(bien.estatusCarga),
  ];
}

export function vehiculoToSudebipReportRow(index: number, vehiculo: Vehiculo): (string | number)[] {
  const categoriaEspecifica =
    vehiculo.categoriaEspecifica && vehiculo.categoriaEspecifica !== '—'
      ? vehiculo.categoriaEspecifica
      : '';

  return [
    index + 1,
    dashToEmpty(vehiculo.sede),
    dashToEmpty(vehiculo.unidadAdministrativa),
    vehiculo.codigoInterno,
    dashToEmpty(vehiculo.descripcion),
    formaAdquisicionSudebip(vehiculo.formaAdquisicion ?? 'Desconocida'),
    sudebipFecha(vehiculo.fechaAdquisicion),
    dashToEmpty(vehiculo.numeroDocumento),
    sudebipMoneda(vehiculo.moneda),
    sudebipValor(vehiculo.valorAdquisicion),
    sudebipEstadoUso(vehiculo.estadoUso),
    vehiculo.condicionFisica.toUpperCase(),
    dashToEmpty(vehiculo.marca) || 'S/M',
    dashToEmpty(vehiculo.modelo) || 'S/M',
    dashToEmpty(vehiculo.color),
    vehiculo.anioFabricacion ?? '',
    vehiculo.sinSerialCarroceria ? 'S/S' : vehiculo.serialCarroceria || 'S/S',
    vehiculo.sinSerialMotor ? 'S/S' : vehiculo.serialMotor || 'S/S',
    vehiculo.sinPlaca ? 'S/P' : vehiculo.placa,
    dashToEmpty(vehiculo.categoriaGeneral),
    dashToEmpty(vehiculo.subcategoria),
    categoriaEspecifica,
    vehiculo.codigoCategoria ? Number(vehiculo.codigoCategoria) || vehiculo.codigoCategoria : '',
    sudebipEstatusCarga(vehiculo.estatusCarga),
  ];
}
