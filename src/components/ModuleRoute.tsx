import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRolePermissions } from '../hooks/useRolePermissions';
import type { AppModule } from '../constants/rolePermissions';

export default function ModuleRoute({
  module,
  children,
}: {
  module: AppModule;
  children: ReactNode;
}) {
  const { canAccessModule, defaultPath } = useRolePermissions();

  if (!canAccessModule(module)) {
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}
