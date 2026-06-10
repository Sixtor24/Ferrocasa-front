import axios, { type AxiosRequestConfig, type Method } from 'axios';
import { ApiValidationError, validateApiPayload, validateApiResponse } from './validation';
import {
  clearAuthSession,
  getAuthorizationHeader,
  getRefreshToken,
  setAuthSession,
} from './auth/session';
import type { AuthSession } from '../types/auth';
import { formatApiErrorMessage } from '../utils/apiErrorMessage';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const http = axios.create({
  baseURL: API_BASE.replace(/\/$/, ''),
  headers: {
    Accept: 'application/json',
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  retryAuth?: boolean;
};

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function sanitizeParams(params?: RequestOptions['params']) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function authHeaders(auth: boolean): AxiosRequestConfig['headers'] {
  const authorization = auth ? getAuthorizationHeader() : null;
  return authorization ? { Authorization: authorization } : undefined;
}

let refreshPromise: Promise<AuthSession | null> | null = null;

function isAuthRefreshPath(path: string) {
  return normalizePath(path).endsWith('/auth/refresh-token');
}

function emitAuthExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ferrocasa:auth-expired'));
  }
}

async function refreshAuthSession(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = http
      .post('/auth/refresh-token', { refresh_token: refreshToken }, { validateStatus: () => true })
      .then((res) => {
        const json = res.data ?? {};
        if (res.status < 200 || res.status >= 300 || json.success === false || !json.data) {
          clearAuthSession();
          emitAuthExpired();
          return null;
        }
        setAuthSession(json.data as AuthSession);
        return json.data as AuthSession;
      })
      .catch(() => {
        clearAuthSession();
        emitAuthExpired();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, auth = true, retryAuth = true } = options;
  const validatedBody = validateApiPayload(path, method, body);
  const res = await http.request({
    url: normalizePath(path),
    method: method as Method,
    data: validatedBody,
    params: sanitizeParams(params),
    headers: authHeaders(auth),
    validateStatus: () => true,
  });
  const json = res.data ?? {};

  if (auth && retryAuth && res.status === 401 && !isAuthRefreshPath(path)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryAuth: false });
    }
  }

  if (res.status < 200 || res.status >= 300 || json.success === false) {
    if (auth && res.status === 401) {
      clearAuthSession();
      emitAuthExpired();
    }
    const fallback =
      res.status === 429
        ? 'Demasiadas solicitudes. Espere un momento e intente de nuevo.'
        : res.status === 502
          ? 'No se pudo conectar con el API (502). En local: ejecuta el backend en el puerto 4000 y Docker/Postgres.'
          : `Error HTTP ${res.status}`;
    throw new ApiError(formatApiErrorMessage(json, fallback), res.status, json);
  }

  try {
    return validateApiResponse<T>(path, method, json);
  } catch (err) {
    if (err instanceof ApiValidationError) {
      throw new ApiError(err.message, res.status, { issues: err.issues, body: json });
    }
    throw err;
  }
}

function parseDownloadFilename(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disposition);
  return match?.[1]?.trim() || fallback;
}

export async function apiDownload(
  path: string,
  params?: RequestOptions['params'],
  fallbackFilename = 'descarga',
  retryAuth = true,
): Promise<void> {
  const res = await http.get<Blob>(normalizePath(path), {
    params: sanitizeParams(params),
    headers: authHeaders(true),
    responseType: 'blob',
    validateStatus: () => true,
  });

  if (retryAuth && res.status === 401 && !isAuthRefreshPath(path)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      await apiDownload(path, params, fallbackFilename, false);
      return;
    }
    clearAuthSession();
    emitAuthExpired();
    throw new ApiError('Sesión expirada', 401);
  }

  if (res.status < 200 || res.status >= 300) {
    const json = await parseAxiosBlobError(res.data);
    throw new ApiError(formatApiErrorMessage(json, `Error HTTP ${res.status}`), res.status, json);
  }

  const blob = res.data;
  const disposition = typeof res.headers['content-disposition'] === 'string'
    ? res.headers['content-disposition']
    : null;
  const filename = parseDownloadFilename(disposition, fallbackFilename);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

async function parseAxiosBlobError(body: unknown) {
  if (!(body instanceof Blob)) return body ?? {};
  try {
    return JSON.parse(await body.text());
  } catch {
    return {};
  }
}
