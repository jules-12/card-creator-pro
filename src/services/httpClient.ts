import { API_CONFIG } from '@/config/api';

/**
 * Client HTTP léger prêt pour Laravel Sanctum.
 * Gère le CSRF, les tokens et les headers JSON automatiquement.
 */

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // nécessaire pour Sanctum cookie-based auth
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(response.status, body.message || response.statusText, body.errors);
    }

    // 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const http = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),

  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
