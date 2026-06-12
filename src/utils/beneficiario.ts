/** Formato API: cédula `V-12345678` o código autoincremental `BEN-0001`. */
export function normalizeIdBeneficiado(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (upper.startsWith('BEN')) {
    const num = trimmed.replace(/\D/g, '');
    if (!num) return trimmed;
    return `BEN-${num.padStart(4, '0')}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits) return `V-${digits}`;

  return trimmed;
}

export function isValidIdBeneficiado(value: string): boolean {
  return /^(V-\d+|BEN-\d{4})$/i.test(value);
}
