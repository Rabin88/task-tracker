import { tokenStorage } from '../lib/tokenStorage';
import type { FieldErrors } from '../lib/fieldErrors';
import { ApiError } from './errors';

// The one place that talks to the API: adds the token, parses JSON, and turns
// the server's { error: { message, details } } into a thrown ApiError.
// Feature API files (features/*/api.ts) call request() and know nothing about fetch.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

// AuthProvider registers a handler so an expired token logs the user out from anywhere.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type ErrorBody = { error?: { message?: string; details?: { field: string; message: string }[] } };

export async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStorage.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const error = (json as ErrorBody | null)?.error;
    // A 401 with a token means it expired or is invalid. Without one it's a failed login.
    if (res.status === 401 && token) onUnauthorized?.();
    const fieldErrors: FieldErrors = {};
    for (const d of error?.details ?? []) fieldErrors[d.field] ??= d.message;
    throw new ApiError(res.status, error?.message ?? 'Something went wrong. Please try again.', fieldErrors);
  }

  return json as T;
}
