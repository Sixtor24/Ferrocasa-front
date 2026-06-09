import { getStoredUser } from '../api/auth/session';

/** El API rechaza `null` en campos string opcionales; enviar cadena vacía. */
export function apiStringField(value?: string | null) {
  return value?.trim() ?? '';
}

/** Extrae solo dígitos de una CI (acepta V-, E-, guiones o espacios). */
export function ciResponsableDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

/** Solo incluir `ci_responsable` si cumple la validación del API (6–12 dígitos). */
export function ciResponsableForApi(value?: string | null) {
  const digits = ciResponsableDigits(value);
  if (digits.length >= 6 && digits.length <= 12) return digits;
  return undefined;
}

/** Normaliza CI para POST/PUT; lanza error legible si no cumple el API. */
export function parseCiResponsableForApi(value: string): string {
  const digits = ciResponsableDigits(value);
  if (digits.length >= 6 && digits.length <= 12) return digits;
  throw new Error('La cédula debe tener entre 6 y 12 dígitos (puede escribirla como V-12345678).');
}

export function usuarioCargaForApi() {
  return getStoredUser()?.nombre_usuario?.trim() ?? '';
}
