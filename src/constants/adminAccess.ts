import type { RoleName } from '../types/auth';

/** Roles con permisos de administración (usuarios, auditoría, tablas maestras). */
export const ADMIN_ACCESS_ROLES: RoleName[] = ['Super Administrador', 'Administrador'];

export function hasAdminAccess(rol: RoleName | undefined | null): boolean {
  if (!rol) return false;
  return ADMIN_ACCESS_ROLES.includes(rol);
}

/** Configuración almacén → responsable (no aplica a Super Administrador). */
export function hasAlmacenResponsableConfigAccess(rol: RoleName | undefined | null): boolean {
  return rol === 'Administrador';
}
