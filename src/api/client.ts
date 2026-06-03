import { ApiValidationError, validateApiPayload, validateApiResponse } from './validation';
import {
  clearAuthSession,
  getAuthorizationHeader,
  getRefreshToken,
  setAuthSession,
} from './auth/session';
import type { AuthSession } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

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

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const base = API_BASE.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${normalized}`;
  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

let refreshPromise: Promise<AuthSession | null> | null = null;

function isAuthRefreshPath(path: string) {
  return buildUrl(path).endsWith('/auth/refresh-token');
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
    refreshPromise = fetch(buildUrl('/auth/refresh-token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false || !json.data) {
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
  const url = buildUrl(path, params);
  const validatedBody = validateApiPayload(path, method, body);
  const authorization = auth ? getAuthorizationHeader() : null;
  const headers = new Headers();

  if (validatedBody) headers.set('Content-Type', 'application/json');
  if (authorization) headers.set('Authorization', authorization);

  const res = await fetch(url, {
    method,
    headers,
    body: validatedBody ? JSON.stringify(validatedBody) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (auth && retryAuth && res.status === 401 && !isAuthRefreshPath(path)) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryAuth: false });
    }
  }

  if (!res.ok || json.success === false) {
    if (auth && res.status === 401) {
      clearAuthSession();
      emitAuthExpired();
    }
    const fallback =
      res.status === 502
        ? 'No se pudo conectar con el API (502). En local: ejecuta el backend en el puerto 4000 y Docker/Postgres.'
        : `Error HTTP ${res.status}`;
    throw new ApiError(json.error ?? json.message ?? fallback, res.status, json);
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
