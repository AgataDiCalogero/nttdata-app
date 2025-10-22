import { HttpContextToken } from '@angular/common/http';

/**
 * Flag requests that should bypass the global error interceptor and handle failures locally.
 * Prefer using HttpContext over sentinel headers so that we keep transport concerns decoupled.
 */
export const SKIP_GLOBAL_ERROR = new HttpContextToken<boolean>(() => false);
