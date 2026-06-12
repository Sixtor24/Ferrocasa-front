import {
  createBeneficiario,
  fetchBeneficiarioById,
  fetchBeneficiarios,
} from '../api/services/beneficiarios.service';
import { fetchResponsableByCi } from '../api/services/responsables.service';

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

function isLikelyCedulaInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (/^V-\d+$/i.test(trimmed)) return true;
  return /^\d{6,8}$/.test(trimmed.replace(/\D/g, ''));
}

async function nombreParaCedula(idBeneficiario: string, raw: string): Promise<string> {
  const ciCandidates = idBeneficiario.startsWith('V-')
    ? [idBeneficiario, idBeneficiario.slice(2)]
    : [idBeneficiario, `V-${raw.replace(/\D/g, '')}`];

  for (const ci of ciCandidates) {
    try {
      const responsable = await fetchResponsableByCi(ci);
      return responsable.nombre;
    } catch {
      // Intentar siguiente formato de cédula.
    }
  }

  return idBeneficiario;
}

async function findBeneficiarioPorNombre(nombre: string) {
  const { data } = await fetchBeneficiarios({ search: nombre, limit: 20 });
  const normalized = nombre.trim().toLowerCase();
  return data.find((item) => item.nombre.trim().toLowerCase() === normalized) ?? null;
}

/**
 * Resuelve el texto ingresado por el usuario al `id_beneficiario` que espera el API.
 * - Nombre libre (ej. Jose, Ferrominera): crea o reutiliza beneficiario por nombre.
 * - Cédula (ej. 12345678 o V-12345678): crea o reutiliza con id V-XXXXXXXX.
 * - Código BEN-0001: reutiliza si existe; si no, lo crea con ese id y el texto como nombre.
 */
export async function resolveBeneficiarioId(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Indique el beneficiario');

  const normalizedId = normalizeIdBeneficiado(trimmed);

  if (isValidIdBeneficiado(normalizedId)) {
    try {
      const existing = await fetchBeneficiarioById(normalizedId);
      return existing.id_beneficiario;
    } catch {
      const nombre = isLikelyCedulaInput(trimmed)
        ? await nombreParaCedula(normalizedId, trimmed)
        : trimmed;
      const created = await createBeneficiario({
        id_beneficiario: normalizedId,
        nombre,
      });
      return created.id_beneficiario;
    }
  }

  const existingByName = await findBeneficiarioPorNombre(trimmed);
  if (existingByName) return existingByName.id_beneficiario;

  const created = await createBeneficiario({ nombre: trimmed });
  return created.id_beneficiario;
}
