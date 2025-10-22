import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { CreatePost, Post, UpdatePost, User } from '@/app/shared/models';
import { AutoFocusDirective } from '@app/shared/directives/auto-focus.directive';
import { ButtonComponent, AlertComponent } from '@app/shared/ui';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface PostFormDialogData {
  users?: User[];
  post?: Post;
}

interface PostFormResult {
  status: 'created' | 'updated';
  post: Post;
}

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AutoFocusDirective,
    ButtonComponent,
    AlertComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostForm {
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly dialogRef = inject(DialogRef<PostFormResult | 'cancel'>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogData = inject<PostFormDialogData | null>(DIALOG_DATA, { optional: true });

  readonly users = signal<User[]>(this.dialogData?.users ?? []);
  private readonly editablePost = signal<Post | null>(this.dialogData?.post ?? null);
  readonly loadingUsers = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
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

  readonly isEdit = computed(() => this.editablePost() !== null);
  readonly dialogTitle = computed(() => (this.isEdit() ? 'Edit post' : 'Create a new post'));
  readonly dialogSubtitle = computed(() =>
    this.isEdit()
      ? 'Update the title, author, or content of this post.'
      : 'Share ideas or reports to help improve the city.',
  );
  readonly submitLabel = computed(() => (this.isEdit() ? 'Save changes' : 'Create post'));

  readonly userOptions = computed(() =>
    this.users().map((user) => ({
      value: user.id,
      label: `${user.name} (ID ${user.id})`,
    })),
  );

  constructor() {
    const post = this.editablePost();
    if (post) {
      this.form.patchValue({
        userId: post.user_id,
        title: post.title,
        body: post.body,
      });

      if (!this.users().some((user) => user.id === post.user_id)) {
        this.usersApi
          .getById(post.user_id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (user) => {
              this.users.update((list) => [...list, user]);
            },
            error: () => {
              // Ignore errors: the select will still bind to the existing value.
            },
          });
      }
    }

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
        next: ({ items }) => {
          this.users.set(items ?? []);
          this.loadingUsers.set(false);
        },
        error: (err) => {
          console.error('Failed to load users for post form:', err);
          this.loadError.set('Unable to load users. Please retry.');
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

    // Clear previous errors
    this.submitError.set(null);

    const payload: CreatePost = {
      user_id: this.userIdControl.value,
      title: this.titleControl.value.trim(),
      body: this.bodyControl.value.trim(),
    };

    this.submitting.set(true);
    this.dialogRef.disableClose = true;

    const existing = this.editablePost();
    const request$ = existing
      ? this.postsApi.update(existing.id, payload as UpdatePost)
      : this.postsApi.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (post) => {
        this.submitting.set(false);
        this.dialogRef.disableClose = false;
        this.dialogRef.close({
          status: existing ? 'updated' : 'created',
          post,
        });
      },
      error: (err) => {
        console.error('Failed to create post:', err);
        this.submitting.set(false);
        this.dialogRef.disableClose = false;
        const status = err?.status;
        if (status === 422) {
          this.submitError.set('Invalid data. Please review the fields.');
          this.titleControl.setErrors({ api: true });
        } else if (status === 429) {
          this.submitError.set('Too many requests. Please try again later.');
        } else {
          this.submitError.set('Unable to save the post. Please retry.');
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
}
