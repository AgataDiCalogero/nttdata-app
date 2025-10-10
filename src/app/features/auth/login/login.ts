import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { take } from 'rxjs';
import { AuthService } from '../../../core/auth/auth-service/auth-service';
import { TokenValidationService } from '../../../core/auth/token-validation.service';
import { TokenHelpDialogComponent } from './token-help-dialog/token-help-dialog.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { ButtonComponent } from '@app/shared/ui/button';

// Login page component for token-based authentication
@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  token: string = '';
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly validator = inject(TokenValidationService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    this.validator
      .validate(this.token)
      .pipe(take(1))
      .subscribe((result) => {
        this.loading.set(false);

        if (!result.success) {
          const message =
            result.message ?? 'Unable to verify the token right now. Please try again.';
          this.errorMessage.set(message);
          this.toast.show('error', message, 5000);
          return;
        }

        const normalized = this.token.trim();
        this.auth.setToken(normalized);
        this.toast.show('success', 'Token verified. Welcome back!');
        this.router.navigate(['/users']);
      });
  }

  openTokenHelp(): void {
    this.dialog.open(TokenHelpDialogComponent, {
      autoFocus: false,
      panelClass: 'token-help-dialog',
    });
  }
}
