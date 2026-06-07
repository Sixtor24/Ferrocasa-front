/**
 * Normaliza códigos patrimoniales tipo S/C, S/C/01, SC/161
 * Retorna true si el código indica "sin código"
 */
export function esSinCodigo(codigo: string): boolean {
  const norm = codigo.trim().toUpperCase().replace(/\s+/g, '');
  return ['S/C', 'SC', 'S/C/', 'SIN CODIGO', 'SINCODIGO', 'N/A', ''].includes(norm)
    || /^S\/C\/?\d*$/.test(norm)
    || /^SC\/?\d*$/.test(norm);
}

/**
 * Normaliza serial: detecta "sin serial"
 */
export function esSinSerial(serial: string): boolean {
  const norm = serial.trim().toUpperCase().replace(/\s+/g, '');
  if (norm.startsWith('S/S:')) return true;
  return ['S/S', 'SS', 'SIN SERIAL', 'SINSERIAL', 'N/A', ''].includes(norm);
}

/**
 * Normaliza placa: detecta "sin placa"
 */
export function esSinPlaca(placa: string): boolean {
  const norm = placa.trim().toUpperCase().replace(/\s+/g, '');
  return ['S/P', 'SP', 'SIN PLACA', 'SINPLACA', 'N/A', ''].includes(norm);
}

/**
 * Normaliza valor monetario: soporta coma y punto decimal
 * "1.500,00" → 1500.00 | "1,500.00" → 1500.00 | "1500" → 1500
 */
export function normalizarValor(valor: string): number | null {
  if (!valor || valor.trim() === '') return null;
  let clean = valor.replace(/[^0-9.,\-]/g, '').trim();

  // Detectar formato europeo: 1.500,00
  if (/\d+\.\d{3},\d{2}$/.test(clean)) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  // Detectar coma como decimal sin miles: 1500,00
  else if (/,\d{1,2}$/.test(clean) && !clean.includes('.')) {
    clean = clean.replace(',', '.');
  }
  // Remover comas de miles: 1,500.00
  else {
    clean = clean.replace(/,/g, '');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

/**
 * Normaliza texto: trim, capitalize
 */
export function capitalizar(texto: string): string {
  return texto.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}
