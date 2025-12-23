import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { TokenValidationService } from '@/app/core/auth/auth-token-validation/token-validation.service';

export interface LoginResult {
  success: boolean;
  code?: 'unauthorized' | 'empty' | 'network' | 'unknown';
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginFacadeService {
  private readonly validator = inject(TokenValidationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Orchestrates the complete login flow:
   * 1. Validates token via TokenValidationService
   * 2. Sets token via AuthService if valid
   * 3. Navigates to /users
   * 4. Returns result with success/error info
   */
  login(token: string): Observable<LoginResult> {
    const normalized = token.trim();

    return this.validator.validate(normalized).pipe(
      map((validationResult) => {
        if (!validationResult.success) {
          return {
            success: false,
            code: validationResult.code as LoginResult['code'],
            message: validationResult.message,
          };
        }

        this.auth.setToken(normalized);
        void this.router.navigate(['/users']);

        return { success: true };
      }),
      catchError((error: unknown) => {
        console.error('Login error:', error);
        const message =
          error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
        return of({
          success: false,
          code: 'network' as const,
          message,
        });
      }),
    );
  }
}
