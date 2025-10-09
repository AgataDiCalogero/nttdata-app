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
import { UsersApiService } from '@app/services/users/users-api.service';
import type { CreateUser, UpdateUser, User, UserStatus } from '@app/models';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private fb = inject(FormBuilder);
  private api = inject(UsersApiService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);
  private dialogRef = inject(DialogRef<'success' | 'cancel'>);
  private dialogData = inject<{ user?: User }>(DIALOG_DATA, { optional: true });

  // Modal mode: optional user input and closed output
  user = input<User | undefined>(undefined);
  closed = output<'success' | 'cancel'>();

  // UI state
  isEdit = signal(false);
  userId = signal<number | null>(null);
  isLoading = signal(false);
  submitting = signal(false);
  loadError = signal<string | null>(null);
  emailError = signal<string | null>(null); // Field-specific error for 422

  // Form (non-nullable controls)
  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    gender: this.fb.nonNullable.control<'male' | 'female'>('male', [Validators.required]),
    status: this.fb.nonNullable.control<UserStatus>('active', [Validators.required]),
  });

  constructor() {
    // Modal mode: if user input is provided via input(), use it
    let inputUser = this.user();

    // Also check dialog data (from config.data)
    if (!inputUser && this.dialogData?.user) {
      inputUser = this.dialogData.user;
    }

    if (inputUser) {
      this.isEdit.set(true);
      this.userId.set(inputUser.id);
      // Patch form immediately with input user
      this.form.patchValue({
        name: inputUser.name ?? '',
        email: inputUser.email ?? '',
        gender: (inputUser.gender as 'male' | 'female') ?? this.form.controls.gender.value,
        status: (inputUser.status as UserStatus) ?? this.form.controls.status.value,
      });
    }
  }

  private normalizeForSubmit(): CreateUser | UpdateUser {
    const raw = this.form.getRawValue();
    const payload: CreateUser = {
      name: String(raw.name).trim(),
      email: String(raw.email).toLowerCase().trim(),
      gender: (raw.gender as 'male' | 'female') ?? 'male',
      status: (raw.status as UserStatus) ?? 'active',
    };
    return payload;
  }

  submit(): void {
    if (this.form.invalid) {
      // Reveal validation errors
      this.form.markAllAsTouched();
      return;
    }

    // Clear previous errors
    this.emailError.set(null);
    this.loadError.set(null);

    this.submitting.set(true);

    // Disable backdrop close when submitting
    this.dialogRef.disableClose = true;

    const payload = this.normalizeForSubmit();

    let op$ = this.api.create(payload as CreateUser);
    if (this.isEdit() && this.userId() !== null) {
      op$ = this.api.update(this.userId()!, payload as UpdateUser);
    }

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const msg = this.isEdit() ? 'User updated successfully' : 'User created successfully';
        this.toast.show('success', msg);
        this.submitting.set(false);

        // Re-enable backdrop close
        this.dialogRef.disableClose = false;

        // Modal mode: close dialog and emit success
        this.closed.emit('success');
        this.dialogRef.close('success');
      },
      error: (err) => {
        // Technical log
        console.error('Save failed:', err);

        this.submitting.set(false);

        // Re-enable backdrop close
        this.dialogRef.disableClose = false;

        // Error mapping
        const status = err?.status;
        if (status === 422) {
          // Validation error - likely email already exists
          this.emailError.set('Email already in use or invalid');
          this.toast.show('error', 'Email already in use or invalid');
        } else if (status === 429) {
          // Rate limit
          this.loadError.set('Please try again shortly');
          this.toast.show('error', 'Too many requests. Please try again shortly.');
        } else {
          // Generic error
          this.loadError.set('Save failed');
          this.toast.show('error', 'An error occurred while saving. Please try again.');
        }
      },
    });
  }

  cancel(): void {
    // Close dialog and emit cancel
    this.closed.emit('cancel');
    this.dialogRef.close('cancel');
  }
}
