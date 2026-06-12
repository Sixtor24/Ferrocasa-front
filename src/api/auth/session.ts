import type { AuthSession, UsuarioSistema } from '../../types/auth';

const REFRESH_TOKEN_KEY = 'ferrocasa_refresh_token';
const USER_KEY = 'ferrocasa_usuario';
const ACCESS_TOKEN_KEY = 'ferrocasa_access_token';
const TOKEN_TYPE_KEY = 'ferrocasa_token_type';

let accessToken: string | null = null;
let tokenType = 'Bearer';

function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function restoreAccessTokenFromSessionStorage() {
  const storage = safeSessionStorage();
  if (!storage) return;
  accessToken = storage.getItem(ACCESS_TOKEN_KEY) ?? null;
  tokenType = storage.getItem(TOKEN_TYPE_KEY) ?? 'Bearer';
}

restoreAccessTokenFromSessionStorage();

export function getAccessToken() {
  return accessToken;
}

export function getAuthorizationHeader() {
  return accessToken ? `${tokenType} ${accessToken}` : null;
}

export function getRefreshToken() {
  return safeLocalStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function getStoredUser(): UsuarioSistema | null {
  const raw = safeLocalStorage()?.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UsuarioSistema;
  } catch {
    safeLocalStorage()?.removeItem(USER_KEY);
    return null;
  }
}

export function setAuthSession(session: AuthSession) {
  accessToken = session.accessToken;
  tokenType = session.tokenType || 'Bearer';

  const local = safeLocalStorage();
  local?.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  local?.setItem(USER_KEY, JSON.stringify(session.usuario));

  const sessionStorage = safeSessionStorage();
  sessionStorage?.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage?.setItem(TOKEN_TYPE_KEY, tokenType);
}

export function setAccessSession(session: AuthSession) {
  setAuthSession(session);
}

export function updateStoredUser(usuario: UsuarioSistema) {
  safeLocalStorage()?.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearAuthSession() {
  accessToken = null;
  tokenType = 'Bearer';
  const local = safeLocalStorage();
  local?.removeItem(REFRESH_TOKEN_KEY);
  local?.removeItem(USER_KEY);
  const sessionStorage = safeSessionStorage();
  sessionStorage?.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage?.removeItem(TOKEN_TYPE_KEY);
}
