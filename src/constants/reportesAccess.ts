import type { RoleName } from '../types/auth';
import { getRolePermissions } from './rolePermissions';

export function hasReportesAccess(rol: RoleName | undefined | null): boolean {
  return getRolePermissions(rol).canAccessReportes;
}
