import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsersApiService } from '../services/users-api-service';
import type { CreateUser, UpdateUser, User, UserStatus } from '@app/models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm {
  private fb = inject(FormBuilder);
  private api = inject(UsersApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // UI state
  isEdit = signal(false);
  userId = signal<number | null>(null);
  isLoading = signal(false);
  submitting = signal(false);
  loadError = signal<string | null>(null);

  // Form (non-nullable controls)
  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    gender: this.fb.nonNullable.control<'male' | 'female'>('male', [Validators.required]),
    status: this.fb.nonNullable.control<UserStatus>('active', [Validators.required]),
  });

  constructor() {
    // Read id once from snapshot — edit mode if present
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.isEdit.set(true);
        this.userId.set(id);
        this.loadUser(id);
      }
    }
  }

  private loadUser(id: number): void {
    this.isLoading.set(true);
    this.api
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u: User) => {
          // patch values if present — ensure gender/status are set to valid defaults
          this.form.patchValue({
            name: u.name ?? '',
            email: u.email ?? '',
            gender: (u.gender as 'male' | 'female') ?? this.form.controls.gender.value,
            status: (u.status as UserStatus) ?? this.form.controls.status.value,
          });
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load user', err);
          this.loadError.set('Impossibile caricare l\u2019utente');
          this.isLoading.set(false);
        },
      });
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

    this.submitting.set(true);
    const payload = this.normalizeForSubmit();

    let op$ = this.api.create(payload as CreateUser);
    if (this.isEdit() && this.userId() !== null) {
      op$ = this.api.update(this.userId()!, payload as UpdateUser);
    }

    op$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Save failed', err);
        this.loadError.set('Salvataggio fallito');
        // keep form enabled for retry
        this.submitting.set(false);
        // show a simple user-facing message
        try {
          alert('Errore durante il salvataggio. Riprova.');
        } catch (e) {
          console.warn('Alert failed', e);
        }
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
