import type { RoleName } from '../types/auth';
import {
  getRolePermissions,
  ROLE_ADMIN,
  ROLE_SUPER_ADMIN,
} from './rolePermissions';

/** Roles con acceso al módulo de auditoría. */
export const ADMIN_ACCESS_ROLES: RoleName[] = [ROLE_SUPER_ADMIN, ROLE_ADMIN];

export function hasAdminAccess(rol: RoleName | undefined | null): boolean {
  return getRolePermissions(rol).canAccessAuditoria;
}

export function hasAlmacenResponsableConfigAccess(rol: RoleName | undefined | null): boolean {
  return getRolePermissions(rol).canConfigAlmacenResponsable;
}

export function hasUserManagementAccess(rol: RoleName | undefined | null): boolean {
  return getRolePermissions(rol).canManageUsers;
}

export function hasMasterTablesAccess(rol: RoleName | undefined | null): boolean {
  return getRolePermissions(rol).canManageMasterTables;
}
