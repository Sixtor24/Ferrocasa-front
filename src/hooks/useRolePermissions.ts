import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRolePermissions } from '../constants/rolePermissions';

export function useRolePermissions() {
  const { user } = useAuth();
  return useMemo(() => getRolePermissions(user?.rol), [user?.rol]);
}
