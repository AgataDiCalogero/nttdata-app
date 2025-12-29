import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AutoFocusDirective } from '@app/shared/directives/auto-focus.directive';
import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { ToastService } from '@app/shared/ui/toast/toast.service';

const extractStatusCode = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    return (error as { status?: number }).status;
  }
  return undefined;
};

import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import type { CreatePost, Post, UpdatePost } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { UsersLookupService } from '@/app/shared/services/users/users-lookup.service';

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
    SelectComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostForm {
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly usersLookup = inject(UsersLookupService);
  private readonly dialogRef = inject(DialogRef<PostFormResult | 'cancel'>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogData = inject<PostFormDialogData | null>(DIALOG_DATA, { optional: true });
  private readonly i18n = inject(I18nService);

  readonly users = computed(() => this.usersLookup.users());
  private readonly editablePost = signal<Post | null>(this.dialogData?.post ?? null);
  readonly loadingUsers = computed(() => this.usersLookup.isLoading());
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  private readonly toast = inject(ToastService);

  private readonly userIdControl = this.fb.nonNullable.control(0, [
    Validators.required,
    Validators.min(1),
  ]);
  private readonly userIdValue = toSignal(this.userIdControl.valueChanges, {
    initialValue: this.userIdControl.value,
  });
  private readonly userIdValidator: ValidatorFn = (control) => {
    const value = control.value as number | null;
    if (typeof value !== 'number' || value <= 0) {
      return { required: true };
    }
    return null;
  };
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
  readonly dialogTitle = computed(() => {
    return this.isEdit()
      ? this.i18n.translate('postForm.titleEdit')
      : this.i18n.translate('postForm.titleNew');
  });

  readonly dialogSubtitle = computed(() => {
    return this.isEdit()
      ? this.i18n.translate('postForm.subtitleEdit')
      : this.i18n.translate('postForm.subtitleNew');
  });

  readonly submitLabel = computed(() => {
    if (this.submitting()) return this.i18n.translate('postForm.buttons.saving');
    if (this.isEdit()) return this.i18n.translate('postForm.buttons.update');
    return this.i18n.translate('postForm.buttons.create');
  });

  readonly userOptions = computed(() => {
    const options = this.users().map((user) => ({
      value: user.id,
      label: `${user.name} (ID ${user.id})`,
    }));
    const post = this.editablePost();
    const missingAuthorId = typeof post?.user_id === 'number' ? post.user_id : null;
    if (
      missingAuthorId !== null &&
      missingAuthorId > 0 &&
      !options.some((option) => Number(option.value) === missingAuthorId)
    ) {
      options.unshift({
        value: missingAuthorId,
        label: this.i18n.translate('postForm.missingAuthor', { id: missingAuthorId }),
      });
    }
    return options;
  });

  readonly hasValidAuthor = computed(() => {
    const value = this.userIdValue();
    if (typeof value === 'number' && value > 0) {
      return this.userExists(value) || this.matchesEditableAuthor(value);
    }
    const fallback = this.editablePost()?.user_id;
    return typeof fallback === 'number' && fallback > 0;
  });

  constructor() {
    const prefetchedUsers = this.dialogData?.users ?? [];
    if (prefetchedUsers.length) {
      this.usersLookup.seed(prefetchedUsers);
    }

    this.userIdControl.addValidators(this.userIdValidator);
    this.loadUsers();

    const post = this.editablePost();
    if (post) {
      this.form.patchValue({
        userId: post.user_id,
        title: post.title,
        body: post.body,
      });
    }

    effect(() => {
      const disableUser = this.submitting() || this.loadingUsers() || this.users().length === 0;
      if (disableUser && this.userIdControl.enabled) {
        this.userIdControl.disable({ emitEvent: false });
      } else if (!disableUser && this.userIdControl.disabled) {
        this.userIdControl.enable({ emitEvent: false });
      }
      this.userIdControl.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      const disableFields = this.submitting();
      const controls = [this.titleControl, this.bodyControl];
      for (const control of controls) {
        if (disableFields && control.enabled) {
          control.disable({ emitEvent: false });
        } else if (!disableFields && control.disabled) {
          control.enable({ emitEvent: false });
        }
      }
    });
  }

  private loadUsers(force = false): void {
    this.loadError.set(null);
    this.usersLookup
      .ensureUsersLoaded({ force })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          console.error('Failed to load users for post form:', err);
          this.loadError.set(this.i18n.translate('postForm.errors.unableToLoadUsers'));
        },
      });
  }

  get userIdInvalid(): boolean {
    const control = this.userIdControl;
    return control.touched && control.invalid;
  }

  get isMissingAuthor(): boolean {
    const value = this.userIdControl.value;
    if (typeof value !== 'number') {
      return false;
    }
    return this.matchesEditableAuthor(value) && !this.userExists(value);
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
    if (this.form.invalid || !this.hasValidAuthor()) {
      this.form.markAllAsTouched();
      this.userIdControl.markAsTouched();
      return;
    }

    const payload: CreatePost = {
      user_id: this.resolveAuthorId(),
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
        const status = extractStatusCode(err);
        if (status === 422) {
          this.titleControl.setErrors({ api: true });
        } else if (status === 429) {
          this.toast.show('error', this.i18n.translate('postForm.errors.rateLimit'));
        } else {
          this.toast.show('error', this.i18n.translate('postForm.errors.saveFailed'));
        }
      },
    });
  }

  retryLoadUsers(): void {
    this.loadUsers(true);
  }

  cancel(): void {
    this.dialogRef.close('cancel');
  }

  private userExists(value: number): boolean {
    return this.users().some((user) => user.id === value);
  }

  private matchesEditableAuthor(value: number): boolean {
    const post = this.editablePost();
    return !!post && post.user_id === value;
  }

  private resolveAuthorId(): number {
    const value = this.userIdControl.value;
    if (typeof value === 'number' && value > 0) {
      return value;
    }
    const fallback = this.editablePost()?.user_id;
    if (typeof fallback === 'number' && fallback > 0) {
      return fallback;
    }
    return 0;
  }
}
