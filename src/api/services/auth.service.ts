import { apiRequest } from '../client';
import { clearAuthSession, getRefreshToken, setAuthSession, updateStoredUser } from '../auth/session';
import type {
  AuthSession,
  ChangePasswordPayload,
  LoginPayload,
  UsuarioSistema,
} from '../../types/auth';
import type { ApiItemResponse } from '../types';

export async function loginRequest(payload: LoginPayload): Promise<AuthSession> {
  const res = await apiRequest<ApiItemResponse<AuthSession>>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  });
  setAuthSession(res.data);
  return res.data;
}

export async function refreshSessionRequest(refreshToken: string): Promise<AuthSession> {
  const res = await apiRequest<ApiItemResponse<AuthSession>>('/auth/refresh-token', {
    method: 'POST',
    body: { refresh_token: refreshToken },
    auth: false,
  });
  setAuthSession(res.data);
  return res.data;
}

export async function fetchPerfil(): Promise<UsuarioSistema> {
  const res = await apiRequest<ApiItemResponse<UsuarioSistema>>('/auth/perfil');
  updateStoredUser(res.data);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });
    }
  } finally {
    clearAuthSession();
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiRequest('/auth/cambiar-password', {
    method: 'PATCH',
    body: payload,
  });
  clearAuthSession();
}
