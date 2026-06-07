import { getStoredUser } from '../api/auth/session';

/** El API rechaza `null` en campos string opcionales; enviar cadena vacía. */
export function apiStringField(value?: string | null) {
  return value?.trim() ?? '';
}

/** Solo incluir `ci_responsable` si cumple la validación del API (6–12 dígitos). */
export function ciResponsableForApi(value?: string | null) {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length >= 6 && digits.length <= 12) return digits;
  return undefined;
}

export function usuarioCargaForApi() {
  return getStoredUser()?.nombre_usuario?.trim() ?? '';
}
