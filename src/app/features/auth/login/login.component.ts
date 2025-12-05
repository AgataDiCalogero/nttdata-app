import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { LoginFacadeService } from './services/login-facade.service';
import { LoginUiService } from './services/login-ui.service';

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
    AlertComponent,
    TranslatePipe,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly loginFacade = inject(LoginFacadeService);
  private readonly loginUi = inject(LoginUiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

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
      return this.i18n.translate('login.errors.required');
    }

    const minlength = control.getError('minlength');
    if (minlength) {
      return this.i18n.translate('login.errors.minLength', { count: minlength.requiredLength });
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
    // Disable form control when loading
    effect(() => {
      const isLoading = this.loading();
      if (isLoading && this.tokenControl.enabled) {
        this.tokenControl.disable({ emitEvent: false });
      } else if (!isLoading && this.tokenControl.disabled) {
        this.tokenControl.enable({ emitEvent: false });
      }
    });

    // Clear API errors when user types
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

    this.loginFacade
      .login(this.tokenControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.loading.set(false);

        if (!result.success) {
          const message =
            result.message ?? this.loginUi.getErrorMessage('login.errors.unableToVerify');

          if (result.code === 'unauthorized' || result.code === 'empty') {
            const existingErrors = this.tokenControl.errors ?? {};
            this.tokenControl.setErrors({ ...existingErrors, api: true });
            this.tokenControl.markAsTouched();
            this.tokenControl.markAsDirty();
            this.apiErrorMessage.set(message);
            this.loginUi.showError(message);
            return;
          }

          this.submissionMessage.set(message);
          this.loginUi.showError(message);
          return;
        }

        // Success - facade already handled navigation
        this.form.reset({ token: '' });
        this.attemptedSubmit.set(false);
      });
  }

  openTokenHelp(): void {
    this.loginUi.openTokenHelp();
  }
}
