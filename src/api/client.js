import { env } from '@/config/env';

export class ApiError extends Error {
  constructor(message, { status, body, path } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

function buildUrl(path, query) {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value != null && value !== '') url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

/**
 * Thin fetch wrapper — attach auth token when backend provides session/JWT.
 */
export async function apiClient(path, {
  method = 'GET',
  body,
  query,
  headers = {},
  signal,
} = {}) {
  if (!env.apiBaseUrl?.trim()) {
    throw new ApiError('API base URL is not configured (VITE_API_BASE_URL)', { path });
  }

  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    signal,
  };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('clearform:auth-token') : null;
  if (token) init.headers.Authorization = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, query), init);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.message ?? res.statusText ?? 'Request failed', {
      status: res.status,
      body: data,
      path,
    });
  }

  return data;
}
