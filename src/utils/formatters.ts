/**
 * Monto editable: coma decimal solo cuando el valor realmente tiene decimales.
 */
export function formatMontoInput(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return '';
  return String(valor).replace('.', ',');
}

export function sanitizeMontoDraft(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const [entero, ...decimales] = cleaned.split(',');
  return decimales.length === 0 ? entero : `${entero},${decimales.join('')}`;
}

export function parseMontoInput(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '').replace(/\./g, '');
  if (cleaned === '' || cleaned === ',') return 0;
  const normalized = cleaned.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formatea número como moneda Bs o USD
 */
export function formatMoneda(valor: number | null, moneda: string = 'Bs'): string {
  if (valor === null || valor === undefined) return '—';
  const [entero, decimales] = valor.toFixed(2).split('.');
  const formatted = `${entero},${decimales}`;
  return `${moneda} ${formatted}`;
}

/**
 * Formatea fecha ISO a formato legible
 */
export function formatFecha(fecha: string): string {
  if (!fecha || fecha === '—') return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
