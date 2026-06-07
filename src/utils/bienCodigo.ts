import type { BienMueble } from '../types/bien';

export function bienCodigoPk(bien: Pick<BienMueble, 'codigoInterno' | 'id'>): string | number {
  const codigo = bien.codigoInterno?.trim();
  if (codigo) return codigo;
  return bien.id;
}
