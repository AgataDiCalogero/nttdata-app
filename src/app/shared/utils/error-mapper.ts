import { HttpErrorResponse } from '@angular/common/http';

export type UiError =
  | { kind: 'unauthorized'; messageKey: string }
  | { kind: 'forbidden'; messageKey: string }
  | { kind: 'validation'; messageKey: string; details?: unknown }
  | { kind: 'rate-limit'; messageKey: string; retryAfterMs?: number }
  | { kind: 'network'; messageKey: string }
  | { kind: 'unknown'; messageKey: string };

export function mapHttpError(error: unknown): UiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { kind: 'unknown', messageKey: 'common.errors.unknown' };
  }

  const { status } = error;

  if (status === 0) {
    return {
      kind: 'network',
      messageKey: 'common.errors.networkUnavailable',
    };
  }

  if (status === 401) {
    return {
      kind: 'unauthorized',
      messageKey: 'common.errors.sessionExpired',
    };
  }

  if (status === 403) {
    return {
      kind: 'forbidden',
      messageKey: 'common.errors.forbidden',
    };
  }

  if (status === 422) {
    return {
      kind: 'validation',
      messageKey: 'common.errors.validation',
      details: error.error,
    };
  }

  if (status === 429) {
    return {
      kind: 'rate-limit',
      messageKey: 'common.errors.rateLimit',
      retryAfterMs: parseRetryAfter(error.headers.get('Retry-After')),
    };
  }

  return {
    kind: 'unknown',
    messageKey: 'common.errors.unexpected',
  };
}

function parseRetryAfter(value: string | null): number | undefined {
  if (value == null || value === '') {
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
