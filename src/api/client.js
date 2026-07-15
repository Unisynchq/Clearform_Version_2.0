import { env } from '@/config/env';
import { auth } from '@/config/firebase';
import { getFreshAuthToken } from '@/features/auth/utils/authTokenRefresh';

export class ApiError extends Error {
  constructor(message, { status, body, path } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.path = path;
  }
}

const PUBLIC_API_PATH_PATTERNS = [
  /^\/forms\/[^/]+\/published$/,
  /^\/forms\/[^/]+\/responses$/,
  /^\/forms\/[^/]+\/responses\/files$/,
  /^\/forms\/[^/]+\/response-quality\/evaluate$/,
];

function isPublicApiPath(path) {
  const normalized = path?.startsWith('/') ? path : `/${path ?? ''}`;
  return PUBLIC_API_PATH_PATTERNS.some((re) => re.test(normalized));
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
  timeoutMs,
  skipAuth = false,
  isFormData = false,
} = {}) {
  if (!env.apiBaseUrl?.trim()) {
    throw new ApiError('API base URL is not configured (VITE_API_BASE_URL)', { path });
  }

  let effectiveSignal = signal;
  if (timeoutMs && typeof AbortController !== 'undefined') {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
    if (signal) {
      signal.addEventListener('abort', () => timeoutController.abort());
    }
    effectiveSignal = timeoutController.signal;
    const clearOnDone = () => clearTimeout(timer);
    if (typeof effectiveSignal.addEventListener === 'function') {
      effectiveSignal.addEventListener('abort', clearOnDone, { once: true });
    }
  }

  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    signal: effectiveSignal,
  };

  if (body !== undefined) {
    if (isFormData) {
      init.body = body;
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  const publicRoute = isPublicApiPath(path) || skipAuth;
  let token =
    typeof window !== 'undefined' ? sessionStorage.getItem('clearform:auth-token') : null;
  if (typeof window !== 'undefined' && auth?.currentUser) {
    try {
      token = await getFreshAuthToken();
    } catch {
      // use cached token
    }
  }
  if (token) init.headers.Authorization = `Bearer ${token}`;

  let res = await fetch(buildUrl(path, query), init);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok && res.status === 401 && typeof window !== 'undefined') {
    try {
      const retryToken = await getFreshAuthToken();
      if (retryToken) {
        init.headers.Authorization = `Bearer ${retryToken}`;
        res = await fetch(buildUrl(path, query), init);
        const retryText = await res.text();
        data = null;
        if (retryText) {
          try {
            data = JSON.parse(retryText);
          } catch {
            data = retryText;
          }
        }
      }
    } catch {
      // fall through to auth-expired
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event('clearform:auth-expired'));
    }
    throw new ApiError(data?.message ?? res.statusText ?? 'Request failed', {
      status: res.status,
      body: data,
      path,
    });
  }

  return data;
}
