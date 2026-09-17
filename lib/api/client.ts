import { ApiErrorResponse } from './types';

export class ApiClientError extends Error {
  statusCode: number;
  error?: string;
  details?: unknown;
  retryAfter?: number;

  constructor(statusCode: number, message: string, error?: string, details?: unknown, retryAfter?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

// Global hook for auth session invalidation on 401
let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(cb: (() => void) | null) {
  onUnauthorizedCallback = cb;
}

async function request<T>(endpoint: string, method: HttpMethod, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  };

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // essential for httpOnly cookie
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiClientError(0, err?.message || 'Network error: could not connect to server', 'NETWORK_ERROR');
  }

  // Handle rate limiting (429)
  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

  if (!response.ok) {
    let errorPayload: ApiErrorResponse | null = null;
    try {
      errorPayload = await response.json();
    } catch {
      // response not JSON
    }

    const rawMessage = errorPayload?.message || response.statusText || 'Request failed';
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

    // Invalidate session on 401 if on a protected route
    if (response.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const isPublic = pathname === '/' || pathname.startsWith('/verify') || pathname.startsWith('/auth');
      if (!isPublic && onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    throw new ApiClientError(
      response.status,
      message,
      errorPayload?.error || response.statusText,
      errorPayload?.details,
      retryAfter,
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'GET', options),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'POST', { ...options, body }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PUT', { ...options, body }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PATCH', { ...options, body }),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'DELETE', options),
};
