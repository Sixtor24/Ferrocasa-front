import type { BienMueble } from '../types/bien';
import type { Vehiculo } from '../types/vehiculo';
import { normalizeCatalogValue } from './registroBienMappers';

type BienValor = Pick<BienMueble, 'codigoInterno' | 'valorAdquisicion'>;
type VehiculoValor = Pick<Vehiculo, 'codigoInterno' | 'valorAdquisicion'>;

function sameCodigoItem(a: string, b: string): boolean {
  if (a === b) return true;
  return normalizeCatalogValue(a) === normalizeCatalogValue(b);
}

/** Suma los valores de adquisición de los bienes de un documento, usando el valor en edición del ítem actual. */
export function sumValorBienesDocumento(
  bienes: BienValor[],
  codigoBienActual: string,
  valorBienActual: number,
): number {
  if (bienes.length === 0) return valorBienActual;

  return bienes.reduce((sum, bien) => {
    const valor = sameCodigoItem(bien.codigoInterno, codigoBienActual)
      ? valorBienActual
      : (bien.valorAdquisicion ?? 0);
    return sum + valor;
  }, 0);
}

/** Suma los valores de adquisición de los vehículos de un documento, usando el valor en edición del ítem actual. */
export function sumValorVehiculosDocumento(
  vehiculos: VehiculoValor[],
  codigoVehiculoActual: string,
  valorVehiculoActual: number,
): number {
  if (vehiculos.length === 0) return valorVehiculoActual;

  return vehiculos.reduce((sum, vehiculo) => {
    const valor = sameCodigoItem(vehiculo.codigoInterno, codigoVehiculoActual)
      ? valorVehiculoActual
      : (vehiculo.valorAdquisicion ?? 0);
    return sum + valor;
  }, 0);
}

/** Actualiza el valor persistido de un ítem dentro de la lista cacheada del documento. */
export function mergeBienValorInDocumentoList<T extends BienValor>(
  bienes: T[],
  codigoInterno: string,
  valorAdquisicion: number | null,
): T[] {
  return bienes.map((bien) =>
    sameCodigoItem(bien.codigoInterno, codigoInterno)
      ? { ...bien, valorAdquisicion }
      : bien,
  );
}

/** Actualiza el valor persistido de un vehículo dentro de la lista cacheada del documento. */
export function mergeVehiculoValorInDocumentoList<T extends VehiculoValor>(
  vehiculos: T[],
  codigoInterno: string,
  valorAdquisicion: number | null,
): T[] {
  return vehiculos.map((vehiculo) =>
    sameCodigoItem(vehiculo.codigoInterno, codigoInterno)
      ? { ...vehiculo, valorAdquisicion }
      : vehiculo,
  );
}
