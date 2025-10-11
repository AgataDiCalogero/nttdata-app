import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { take } from 'rxjs';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { TokenValidationService } from '@app/core/auth/token-validation.service';
import { TokenHelpDialogComponent } from './token-help-dialog/token-help-dialog.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';

// Login page component for token-based authentication
@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonComponent, AlertComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  token: string = '';
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly validator = inject(TokenValidationService);

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
          // Toast rimosso: mostriamo solo l'errore inline sotto il form
          return;
        }

        const normalized = this.token.trim();
        this.auth.setToken(normalized);
        // Toast rimosso: l'utente viene reindirizzato immediatamente
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
