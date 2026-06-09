import type { RoleName } from '../types/auth';

/** Roles con acceso a reportes gerenciales y exportación. */
export const REPORTES_ACCESS_ROLES: RoleName[] = [
  'Super Administrador',
  'Administrador',
  'Coordinador',
];

export function hasReportesAccess(rol: RoleName | undefined | null): boolean {
  if (!rol) return false;
  return REPORTES_ACCESS_ROLES.includes(rol);
}
