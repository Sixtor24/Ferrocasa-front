import type { BienMueble } from '../types/bien';
import { normalizeCatalogValue } from './registroBienMappers';

type BienValor = Pick<BienMueble, 'codigoInterno' | 'valorAdquisicion'>;

function sameCodigoBien(a: string, b: string): boolean {
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
    const valor = sameCodigoBien(bien.codigoInterno, codigoBienActual)
      ? valorBienActual
      : (bien.valorAdquisicion ?? 0);
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
    sameCodigoBien(bien.codigoInterno, codigoInterno)
      ? { ...bien, valorAdquisicion }
      : bien,
  );
}
