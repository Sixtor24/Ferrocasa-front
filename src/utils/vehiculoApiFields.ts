import type { ApiDocumento } from '../api/types';
import { getStoredUser } from '../api/auth/session';

/** Normaliza IDs de entidad (p. ej. BIGINT) al string que espera el API en POST/PUT. */
export function entityIdForApi(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    throw new Error('El documento de ingreso (id_doc) es obligatorio');
  }
  return String(value);
}

/** Código del vehículo en POST /vehiculos (campo `codigo`, no confundir con codigo en URL de PUT). */
export function vehiculoCodigoForApi(value: number | string | null | undefined): string {
  const codigo = String(value ?? '').trim();
  if (!codigo) {
    throw new Error('El código del vehículo es obligatorio');
  }
  return codigo;
}

/** Lee id_doc del documento creado, con fallbacks frecuentes del API. */
export function readDocumentoId(doc: ApiDocumento): string {
  const extended = doc as ApiDocumento & {
    id?: number | string;
    idDoc?: number | string;
    id_documento?: number | string;
    documento?: { id_doc?: number | string; id?: number | string };
  };

  const raw =
    extended.id_doc
    ?? extended.id
    ?? extended.idDoc
    ?? extended.id_documento
    ?? extended.documento?.id_doc
    ?? extended.documento?.id;

  return entityIdForApi(raw);
}

/** El API rechaza `null` en campos string opcionales; enviar cadena vacía. */
export function apiStringField(value?: string | null) {
  return value?.trim() ?? '';
}

/**
 * Serial en POST /vehiculos: el API exige string (no null).
 * Sin valor → placeholder único por código para evitar colisión @unique en BD.
 */
export function vehiculoSerialCreateForApi(
  value: string | null | undefined,
  kind: 'motor' | 'carroceria',
  uniqueKey: string,
): string {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  const key = String(uniqueKey).trim() || 'NA';
  const prefix = kind === 'motor' ? 'S/M' : 'S/C';
  return `${prefix}-${key}`;
}

/** Serial en PUT /vehiculos: el API acepta string | null. */
export function vehiculoSerialUpdateForApi(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
