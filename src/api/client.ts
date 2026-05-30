import { ApiValidationError, validateApiPayload, validateApiResponse } from './validation';

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

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;
  const url = buildUrl(path, params);
  const validatedBody = validateApiPayload(path, method, body);

  const res = await fetch(url, {
    method,
    headers: validatedBody ? { 'Content-Type': 'application/json' } : undefined,
    body: validatedBody ? JSON.stringify(validatedBody) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
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
