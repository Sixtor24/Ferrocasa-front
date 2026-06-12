import type { RoleName } from '../types/auth';

export const ROLE_SUPER_ADMIN = 'Super Administrador' as const;
export const ROLE_ADMIN = 'Administrador' as const;
export const ROLE_COORDINADOR = 'Coordinador' as const;
export const ROLE_ANALISTA = 'Analista' as const;
export const ROLE_ALMACENISTA = 'Almacenista' as const;

export type AppModule =
  | 'dashboard'
  | 'almacen'
  | 'cementerio'
  | 'terrenos'
  | 'vehiculos'
  | 'reportes'
  | 'auditoria'
  | 'configuracion';

export type RolePermissions = {
  role: RoleName | null;
  defaultPath: string;
  canAccessModule: (module: AppModule) => boolean;
  canAccessAuditoria: boolean;
  canAccessReportes: boolean;
  canManageUsers: boolean;
  canManageMasterTables: boolean;
  canConfigAlmacenResponsable: boolean;
  /** Crear registro, editar detalle, protocolizaciones, etc. */
  canWriteAssets: boolean;
  /** Solo listado y detalle sin edición. */
  isAssetReadOnly: boolean;
  canTransferBien: boolean;
  canRetireBien: boolean;
  canExportInventory: boolean;
};

const ASSET_MODULES: AppModule[] = ['almacen', 'cementerio', 'terrenos', 'vehiculos'];

function moduleAllowed(rol: RoleName, module: AppModule): boolean {
  switch (module) {
    case 'dashboard':
      return rol !== ROLE_ALMACENISTA;
    case 'almacen':
    case 'cementerio':
    case 'terrenos':
    case 'vehiculos':
      return true;
    case 'reportes':
      return (
        rol === ROLE_SUPER_ADMIN
        || rol === ROLE_ADMIN
        || rol === ROLE_COORDINADOR
      );
    case 'auditoria':
      return rol === ROLE_SUPER_ADMIN || rol === ROLE_ADMIN;
    case 'configuracion':
      return true;
    default:
      return false;
  }
}

export function getDefaultPathForRole(rol: RoleName | null | undefined): string {
  if (rol === ROLE_ALMACENISTA) return '/almacen';
  return '/dashboard';
}

export function getRolePermissions(rol: RoleName | null | undefined): RolePermissions {
  const role = rol ?? null;
  const defaultPath = getDefaultPathForRole(role);

  if (!role) {
    return {
      role: null,
      defaultPath,
      canAccessModule: () => false,
      canAccessAuditoria: false,
      canAccessReportes: false,
      canManageUsers: false,
      canManageMasterTables: false,
      canConfigAlmacenResponsable: false,
      canWriteAssets: false,
      isAssetReadOnly: true,
      canTransferBien: false,
      canRetireBien: false,
      canExportInventory: false,
    };
  }

  const isSuperAdmin = role === ROLE_SUPER_ADMIN;
  const isAdmin = role === ROLE_ADMIN;
  const isCoordinador = role === ROLE_COORDINADOR;
  const isAnalista = role === ROLE_ANALISTA;
  const isAlmacenista = role === ROLE_ALMACENISTA;

  const canWriteAssets =
    isSuperAdmin || isAdmin || isCoordinador || isAnalista;
  const isAssetReadOnly = isAlmacenista;

  const canTransferBien =
    isSuperAdmin || isAdmin || isCoordinador;
  const canRetireBien =
    isSuperAdmin || isAdmin || isCoordinador;

  return {
    role,
    defaultPath,
    canAccessModule: (module: AppModule) => moduleAllowed(role, module),
    canAccessAuditoria: isSuperAdmin || isAdmin,
    canAccessReportes: isSuperAdmin || isAdmin || isCoordinador,
    canManageUsers: isSuperAdmin,
    canManageMasterTables: isSuperAdmin,
    canConfigAlmacenResponsable: isSuperAdmin || isAdmin,
    canWriteAssets,
    isAssetReadOnly,
    canTransferBien,
    canRetireBien,
    canExportInventory: canWriteAssets,
  };
}

export function pathToModule(pathname: string): AppModule | null {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard';
  if (pathname.startsWith('/almacen')) return 'almacen';
  if (pathname.startsWith('/cementerio')) return 'cementerio';
  if (pathname.startsWith('/terrenos')) return 'terrenos';
  if (pathname.startsWith('/vehiculos')) return 'vehiculos';
  if (pathname.startsWith('/reportes')) return 'reportes';
  if (pathname.startsWith('/auditoria')) return 'auditoria';
  if (pathname.startsWith('/configuracion')) return 'configuracion';
  return null;
}

export function isAssetModule(module: AppModule): boolean {
  return ASSET_MODULES.includes(module);
}
