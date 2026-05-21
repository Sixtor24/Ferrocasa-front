/**
 * Formatea número como moneda Bs o USD
 */
export function formatMoneda(valor: number | null, moneda: string = 'Bs'): string {
  if (valor === null || valor === undefined) return '—';
  const formatted = valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${moneda} ${formatted}`;
}

/**
 * Formatea fecha ISO a formato legible
 */
export function formatFecha(fecha: string): string {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

/**
 * Formatea área en m²
 */
export function formatArea(area: number | null): string {
  if (area === null || area === undefined) return '—';
  return `${area.toLocaleString('es-VE')} m²`;
}

/**
 * Truncar texto con ellipsis
 */
export function truncar(texto: string, max: number = 40): string {
  if (texto.length <= max) return texto;
  return texto.substring(0, max) + '…';
}
