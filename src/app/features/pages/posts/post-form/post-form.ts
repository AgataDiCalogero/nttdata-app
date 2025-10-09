import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { PostsApiService } from '../posts-api.service';
import { UsersApiService } from '../../users/services/users-api-service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { CreatePost, User } from '@app/models';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './post-form.html',
  styleUrls: ['./post-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostForm {
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(DialogRef<'success' | 'cancel'>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogData = inject<{ users?: User[] }>(DIALOG_DATA, { optional: true });

  readonly users = signal<User[]>(this.dialogData?.users ?? []);
  readonly loadingUsers = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);

  private readonly userIdControl = this.fb.nonNullable.control(0, [
    Validators.required,
    Validators.min(1),
  ]);
  private readonly titleControl = this.fb.nonNullable.control('', [
    Validators.required,
    Validators.minLength(5),
  ]);
  private readonly bodyControl = this.fb.nonNullable.control('', [
    Validators.required,
    Validators.minLength(20),
  ]);

  readonly form = this.fb.nonNullable.group({
    userId: this.userIdControl,
    title: this.titleControl,
    body: this.bodyControl,
  });

  constructor() {
    if (!this.users().length) {
      this.fetchUsers();
    }
  }

  private fetchUsers(): void {
    this.loadingUsers.set(true);
    this.loadError.set(null);
    this.usersApi
      .list({ per_page: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.users.set(users ?? []);
          this.loadingUsers.set(false);
        },
        error: (err) => {
          console.error('Failed to load users for post form:', err);
          this.loadError.set('Impossibile caricare gli utenti. Riprova.');
          this.loadingUsers.set(false);
        },
      });
  }

  get userIdInvalid(): boolean {
    const control = this.userIdControl;
    return control.touched && control.invalid;
  }

  get titleInvalid(): boolean {
    const control = this.titleControl;
    return control.touched && control.invalid;
  }

  get bodyInvalid(): boolean {
    const control = this.bodyControl;
    return control.touched && control.invalid;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreatePost = {
      user_id: this.userIdControl.value,
      title: this.titleControl.value.trim(),
      body: this.bodyControl.value.trim(),
    };

    this.submitting.set(true);
    this.dialogRef.disableClose = true;

    this.postsApi
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.disableClose = false;
          this.toast.show('success', 'Post creato con successo');
          this.dialogRef.close('success');
        },
        error: (err) => {
          console.error('Failed to create post:', err);
          this.submitting.set(false);
          this.dialogRef.disableClose = false;
          const status = err?.status;
          if (status === 422) {
            this.toast.show('error', 'Dati non validi. Controlla i campi.');
            this.titleControl.setErrors({ api: true });
          } else if (status === 429) {
            this.toast.show('error', 'Limite di richieste raggiunto. Riprovare piu tardi.');
          } else {
            this.toast.show('error', 'Impossibile creare il post. Riprova.');
          }
        },
      });
  }

  retryLoadUsers(): void {
    this.fetchUsers();
  }

  cancel(): void {
    this.dialogRef.close('cancel');
  }

  trackUserById(_index: number, user: User): number {
    return user.id;
  }
}
