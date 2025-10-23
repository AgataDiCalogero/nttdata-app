import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import type { Comment, CreateComment } from '@/app/shared/models';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, AlertComponent],
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly postId = input.required<number>();
  readonly placeholder = input<string>('Share your thoughts...');
  readonly created = output<Comment>();
  readonly cancelled = output<void>();

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    body: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10)]),
  });

  get bodyLength(): number {
    return this.form.controls.body.value.length;
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

    this.postsApi
      .createComment(this.postId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.toast.show('success', 'Comment posted successfully');
          this.created.emit(comment);
          this.form.controls.body.reset('');
        },
        error: (err) => {
          console.error('Failed to create comment:', err);
          const status = err?.status;
          if (status === 422) {
            this.toast.show('error', 'Comment data not valid. Please review the fields.');
            this.submitError.set('Comment data not valid. Please review the fields.');
          } else if (status === 429) {
            this.toast.show('error', 'Too many requests. Please try again shortly.');
            this.submitError.set('Too many requests. Please try again shortly.');
          } else {
            this.toast.show('error', 'Unable to publish the comment. Please retry.');
            this.submitError.set('Unable to publish the comment. Please retry.');
          }
        },
        complete: () => {
          this.submitting.set(false);
        },
      });
  }

  cancel(): void {
    this.form.reset();
    this.submitError.set(null);
    this.cancelled.emit();
  }
}
