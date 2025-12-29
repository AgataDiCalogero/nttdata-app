import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  effect,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { ToastService } from '@app/shared/ui/toast/toast.service';

import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import type { Comment, CreateComment } from '@/app/shared/models/post';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly commentsFacade = inject(CommentsFacadeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);

  readonly postId = input.required<number>();
  readonly placeholder = input<string>('');
  readonly created = output<Comment>();

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  protected readonly placeholderText = computed(() => {
    const placeholder = this.placeholder().trim();
    return placeholder.length ? placeholder : this.i18n.translate('commentForm.placeholders.body');
  });

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    body: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10)]),
  });

  private readonly syncDisabled = effect(() => {
    const isSubmitting = this.submitting();
    if (isSubmitting) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  });

  get bodyLength(): number {
    return this.form.controls.body.value.length;
  }

  get bodyDescribedBy(): string | null {
    const ids = ['comment-body-hint'];
    if (this.form.controls.body.invalid && this.form.controls.body.touched) {
      ids.push('comment-body-error');
    }
    return ids.filter(Boolean).join(' ') || null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateComment = {
      name: this.form.controls.name.value.trim(),
      email: this.form.controls.email.value.trim().toLowerCase(),
      body: this.form.controls.body.value.trim(),
    };

    this.submitting.set(true);

    this.commentsFacade
      .createComment(this.postId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.submitting.set(false);
          this.created.emit(comment);
          this.toast.show('success', this.i18n.translate('commentForm.toastSuccess'));
          this.submitError.set(null);
          this.form.reset();
          this.form.markAsUntouched();
          this.form.markAsPristine();
          for (const control of Object.values(this.form.controls)) {
            control.markAsUntouched();
            control.markAsPristine();
            control.setErrors(null);
            control.updateValueAndValidity({ emitEvent: false });
          }
          this.form.updateValueAndValidity({ emitEvent: false });
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('Failed to create comment:', err);
          const status =
            typeof err === 'object' && err !== null && 'status' in err
              ? (err as { status?: number }).status
              : undefined;
          if (status === 422) {
            const message = this.i18n.translate('commentForm.submitErrors.validation');
            this.toast.show('error', message);
            this.submitError.set(message);
          } else if (status === 429) {
            const message = this.i18n.translate('commentForm.submitErrors.rateLimit');
            this.toast.show('error', message);
            this.submitError.set(message);
          } else {
            const message = this.i18n.translate('commentForm.submitErrors.publishFailed');
            this.toast.show('error', message);
            this.submitError.set(message);
          }
        },
      });
  }
}
