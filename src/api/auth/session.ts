import type { AuthSession, UsuarioSistema } from '../../types/auth';

const REFRESH_TOKEN_KEY = 'ferrocasa_refresh_token';
const USER_KEY = 'ferrocasa_usuario';

let accessToken: string | null = null;
let tokenType = 'Bearer';

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getAuthorizationHeader() {
  return accessToken ? `${tokenType} ${accessToken}` : null;
}

export function getRefreshToken() {
  return safeStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function getStoredUser(): UsuarioSistema | null {
  const raw = safeStorage()?.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UsuarioSistema;
  } catch {
    safeStorage()?.removeItem(USER_KEY);
    return null;
  }
}

export function setAuthSession(session: AuthSession) {
  accessToken = session.accessToken;
  tokenType = session.tokenType || 'Bearer';

  const storage = safeStorage();
  storage?.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  storage?.setItem(USER_KEY, JSON.stringify(session.usuario));
}

export function setAccessSession(session: AuthSession) {
  setAuthSession(session);
}

export function updateStoredUser(usuario: UsuarioSistema) {
  safeStorage()?.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearAuthSession() {
  accessToken = null;
  tokenType = 'Bearer';
  const storage = safeStorage();
  storage?.removeItem(REFRESH_TOKEN_KEY);
  storage?.removeItem(USER_KEY);
}
