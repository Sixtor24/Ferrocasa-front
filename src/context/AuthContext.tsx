import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchPerfil,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
} from '../api/services/auth.service';
import { clearAuthSession, getRefreshToken, getStoredUser } from '../api/auth/session';
import type { RoleName, UsuarioSistema } from '../types/auth';
import { useApiCacheStore } from '../stores/apiCacheStore';
import { useModuleUiStore } from '../stores/moduleUiStore';

export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  rol: RoleName;
  avatar: string;
  activo: boolean;
  raw: UsuarioSistema;
}

interface AuthContextType {
  user: User | null;
  usuario: UsuarioSistema | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roles: RoleName | RoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function initials(value: string) {
  return value
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AU';
}

function mapUsuarioToUser(usuario: UsuarioSistema): User {
  return {
    id: usuario.id_usuario,
    username: usuario.nombre_usuario,
    email: usuario.correo,
    nombre: usuario.nombre_usuario,
    rol: usuario.rol.nombre_rol,
    avatar: initials(usuario.nombre_usuario),
    activo: usuario.activo,
    raw: usuario,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSistema | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const user = useMemo(() => (usuario ? mapUsuarioToUser(usuario) : null), [usuario]);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthSession();
        if (mounted) setUsuario(null);
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        await refreshSessionRequest(refreshToken);
        const perfil = await fetchPerfil();
        if (mounted) setUsuario(perfil);
      } catch {
        clearAuthSession();
        if (mounted) setUsuario(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrapSession();

    const handleExpired = () => {
      useApiCacheStore.getState().clear();
      useModuleUiStore.setState({ modules: {} });
      clearAuthSession();
      setUsuario(null);
    };
    window.addEventListener('ferrocasa:auth-expired', handleExpired);

    return () => {
      mounted = false;
      window.removeEventListener('ferrocasa:auth-expired', handleExpired);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const session = await loginRequest({
      nombre_usuario: username.trim(),
      password,
    });
    useApiCacheStore.getState().clear();
    useModuleUiStore.setState({ modules: {} });
    setUsuario(session.usuario);
  };

  const logout = async () => {
    await logoutRequest();
    useApiCacheStore.getState().clear();
    useModuleUiStore.setState({ modules: {} });
    setUsuario(null);
  };

  const hasRole = (roles: RoleName | RoleName[]) => {
    if (!usuario) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(usuario.rol.nombre_rol);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        usuario,
        login,
        logout,
        isAuthenticated: !!usuario,
        isLoading,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
