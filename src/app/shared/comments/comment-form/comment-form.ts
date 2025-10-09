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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostsApiService } from '../../../features/pages/posts/posts-api.service';
import type { Comment, CreateComment } from '@app/models';
import { ToastService } from '../../toast/toast.service';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comment-form.html',
  styleUrls: ['./comment-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentForm {
  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly postId = input.required<number>();
  readonly created = output<Comment>();

  readonly submitting = signal(false);

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
          this.toast.show('success', 'Commento pubblicato');
          this.created.emit(comment);
          this.form.controls.body.reset('');
        },
        error: (err) => {
          console.error('Failed to create comment:', err);
          const status = err?.status;
          if (status === 422) {
            this.toast.show('error', 'Dati commento non validi. Controlla i campi.');
          } else if (status === 429) {
            this.toast.show('error', 'Limite di richieste raggiunto. Riprova tra poco.');
          } else {
            this.toast.show('error', 'Impossibile pubblicare il commento. Riprova.');
          }
        },
        complete: () => {
          this.submitting.set(false);
        },
      });
  }
}
