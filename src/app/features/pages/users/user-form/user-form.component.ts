import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  input,
  output,
} from '@angular/core';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import type { CreateUser, UpdateUser, User, UserStatus } from '@/app/shared/models/user';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { AutoFocusDirective } from '@app/shared/directives/auto-focus.directive';
import { ToastService } from '@app/shared/ui/toast/toast.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    AlertComponent,
    SelectComponent,
    AutoFocusDirective,
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UsersApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(DialogRef<'success' | 'cancel'>);
  private readonly dialogData = inject<{ user?: User }>(DIALOG_DATA, { optional: true });
  private readonly toast = inject(ToastService);

  user = input<User | undefined>(undefined);
  closed = output<'success' | 'cancel'>();

  isEdit = signal(false);
  userId = signal<number | null>(null);
  submitting = signal(false);
  loadError = signal<string | null>(null);
  emailError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    gender: this.fb.nonNullable.control<'male' | 'female'>('male', [Validators.required]),
    status: this.fb.nonNullable.control<UserStatus>('active', [Validators.required]),
  });

  constructor() {
    let inputUser = this.user();

    if (!inputUser && this.dialogData?.user) {
      inputUser = this.dialogData.user;
    }

    if (inputUser) {
      this.isEdit.set(true);
      this.userId.set(inputUser.id);

      this.form.patchValue({
        name: inputUser.name ?? '',
        email: inputUser.email ?? '',
        gender: this.normalizeGender(inputUser.gender) ?? this.form.controls.gender.value,
        status: this.normalizeStatus(inputUser.status) ?? this.form.controls.status.value,
      });
    }
  }

  private normalizeForSubmit(): CreateUser | UpdateUser {
    const raw = this.form.getRawValue();
    const payload: CreateUser = {
      name: String(raw.name).trim(),
      email: String(raw.email).toLowerCase().trim(),
      gender: this.normalizeGender(raw.gender) ?? 'male',
      status: this.normalizeStatus(raw.status) ?? 'active',
    };
    return payload;
  }

  private normalizeGender(value: unknown): 'male' | 'female' | undefined {
    if (typeof value !== 'string') return undefined;
    const v = value.toLowerCase();
    if (v === 'male') return 'male';
    if (v === 'female') return 'female';
    return undefined;
  }

  private normalizeStatus(value: unknown): UserStatus | undefined {
    if (value === 'active' || value === 'inactive') return value;
    return undefined;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.emailError.set(null);
    this.loadError.set(null);

    this.submitting.set(true);

    this.dialogRef.disableClose = true;

    const payload = this.normalizeForSubmit();

    let op$ = this.api.create(payload as CreateUser);
    if (this.isEdit() && this.userId() !== null) {
      op$ = this.api.update(this.userId()!, payload as UpdateUser);
    }

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.submitting.set(false);

        this.dialogRef.disableClose = false;

        this.closed.emit('success');
        this.dialogRef.close('success');
      },
      error: (err) => {
        console.error('Save failed:', err);

        this.submitting.set(false);

        this.dialogRef.disableClose = false;

        const status = err?.status;
        if (status === 422) {
          this.emailError.set('Email already in use or invalid');
        } else if (status === 429) {
          this.toast.show('error', 'Too many requests. Please try again shortly.');
        } else {
          this.toast.show('error', 'An error occurred while saving. Please try again.');
        }
      },
    });
  }

  cancel(): void {
    this.closed.emit('cancel');
    this.dialogRef.close('cancel');
  }
}
