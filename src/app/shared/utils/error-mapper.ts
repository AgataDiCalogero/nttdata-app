import { HttpErrorResponse } from '@angular/common/http';

export type UiError =
  | { kind: 'unauthorized'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'validation'; message: string; details?: unknown }
  | { kind: 'rate-limit'; message: string; retryAfterMs?: number }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; message: string };

export function mapHttpError(error: unknown): UiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { kind: 'unknown', message: 'Something went wrong. Please try again.' };
  }

  const { status } = error;

  if (status === 0) {
    return {
      kind: 'network',
      message: 'Network unavailable. Check your connection and retry.',
    };
  }

  if (status === 401) {
    return {
      kind: 'unauthorized',
      message: 'Your session expired. Please sign in again.',
    };
  }

  if (status === 403) {
    return {
      kind: 'forbidden',
      message: 'You do not have permission to perform this action.',
    };
  }

  if (status === 422) {
    return {
      kind: 'validation',
      message: 'Some fields are invalid. Please review the form and try again.',
      details: error.error,
    };
  }

  if (status === 429) {
    return {
      kind: 'rate-limit',
      message: 'Too many requests. Please wait a moment and try again.',
      retryAfterMs: parseRetryAfter(error.headers?.get('Retry-After')),
    };
  }

  return {
    kind: 'unknown',
    message: 'Unexpected error. Please try again later.',
  };
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.max(0, numeric) * 1000;
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const delta = parsed - Date.now();
    return delta > 0 ? delta : undefined;
  }

  return undefined;
}
