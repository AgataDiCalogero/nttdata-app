import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { TokenValidationService } from '@app/core/auth/token-validation.service';
import { TokenHelpDialogComponent } from './token-help-dialog/token-help-dialog.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ButtonComponent,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(Dialog);
  private readonly validator = inject(TokenValidationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlays = inject(UiOverlayService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  private readonly apiErrorMessage = signal<string | null>(null);
  readonly submissionMessage = signal<string | null>(null);
  private readonly attemptedSubmit = signal(false);
  readonly tokenErrorId = 'token-error';

  readonly form = this.fb.nonNullable.group({
    token: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  readonly tokenControl = this.form.controls.token;

  readonly tokenErrorMessage = computed(() => {
    const control = this.tokenControl;
    if (!(control.touched || control.dirty || this.attemptedSubmit())) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Access token is required.';
    }

    const minlength = control.getError('minlength');
    if (minlength) {
      return `Access token must be at least ${minlength.requiredLength} characters.`;
    }

    if (control.hasError('api')) {
      return this.apiErrorMessage();
    }

    return null;
  });

  readonly showTokenInvalidState = computed(
    () =>
      this.tokenControl.invalid &&
      (this.tokenControl.touched || this.tokenControl.dirty || this.attemptedSubmit()),
  );

  constructor() {
    effect(() => {
      const isLoading = this.loading();
      if (isLoading && this.tokenControl.enabled) {
        this.tokenControl.disable({ emitEvent: false });
      } else if (!isLoading && this.tokenControl.disabled) {
        this.tokenControl.enable({ emitEvent: false });
      }
    });

    this.tokenControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.tokenControl.hasError('api')) {
        const existing: ValidationErrors = (this.tokenControl.errors ?? {}) as ValidationErrors;
        const rest = Object.fromEntries(
          Object.entries(existing).filter(([k]) => k !== 'api'),
        ) as ValidationErrors;
        this.tokenControl.setErrors(Object.keys(rest).length ? rest : null);
      }
      if (this.apiErrorMessage()) {
        this.apiErrorMessage.set(null);
      }
      if (this.submissionMessage()) {
        this.submissionMessage.set(null);
      }
    });
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    this.attemptedSubmit.set(true);
    this.apiErrorMessage.set(null);
    this.submissionMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.validator
      .validate(this.tokenControl.value)
      .pipe(take(1))
      .subscribe((result) => {
        this.loading.set(false);

        if (!result.success) {
          const message =
            result.message ?? 'Unable to verify the token right now. Please try again.';
          if (result.code === 'unauthorized' || result.code === 'empty') {
            const existingErrors = this.tokenControl.errors ?? {};
            this.tokenControl.setErrors({ ...existingErrors, api: true });
            this.tokenControl.markAsTouched();
            this.tokenControl.markAsDirty();
            this.apiErrorMessage.set(message);
            this.toast.show('error', message, 5000);
            return;
          }

          this.submissionMessage.set(message);
          this.toast.show('error', message, 5000);
          return;
        }

        const normalized = this.tokenControl.value.trim();
        this.apiErrorMessage.set(null);
        this.submissionMessage.set(null);
        this.auth.setToken(normalized);
        this.form.reset({ token: '' });
        this.attemptedSubmit.set(false);
        this.router.navigate(['/users']);
      });
  }

  openTokenHelp(): void {
    const dialogRef = this.dialog.open(TokenHelpDialogComponent, {
      autoFocus: false,
      panelClass: ['token-help-dialog', 'app-dialog-panel'],
      backdropClass: 'app-dialog-overlay',
    });

    this.overlays.activate({
      key: 'token-help-dialog',
      close: () => dialogRef.close(),
      blockGlobalControls: true,
    });

    dialogRef.closed.pipe(take(1)).subscribe(() => {
      this.overlays.release('token-help-dialog');
    });
  }
}
