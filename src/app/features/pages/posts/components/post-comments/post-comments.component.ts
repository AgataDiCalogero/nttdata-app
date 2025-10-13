import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentFormComponent } from '@/app/shared/comments/comment-form/comment-form.component';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { LucideAngularModule, Pencil, X } from 'lucide-angular';
import type { Comment } from '@/app/shared/models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-post-comments',
  imports: [CommonModule, CommentFormComponent, ReactiveFormsModule, ButtonComponent, LucideAngularModule],
  templateUrl: './post-comments.component.html',
  styleUrls: ['./post-comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCommentsComponent {
  @Input() comments: Comment[] | null = null;
  @Input() loading = false;
  @Input() postId = 0;

  @Output() commentCreated = new EventEmitter<Comment>();
  @Output() commentUpdated = new EventEmitter<Comment>();

  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Pencil = Pencil;
  readonly X = X;

  readonly editingId = signal<number | null>(null);
  readonly submittingEdit = signal(false);
  readonly editError = signal<string | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    body: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(5)]),
  });

  startEdit(comment: Comment): void {
    this.editingId.set(comment.id);
    this.editError.set(null);
    this.editForm.reset({ body: comment.body });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editError.set(null);
    this.editForm.reset();
  }

  saveEdit(comment: Comment): void {
    if (this.editForm.invalid || this.submittingEdit()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const trimmed = this.editForm.controls.body.value.trim();
    if (!trimmed || trimmed === comment.body) {
      this.cancelEdit();
      return;
    }

    this.submittingEdit.set(true);
    this.editError.set(null);

    this.postsApi
      .updateComment(comment.id, { body: trimmed })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.toast.show('success', 'Comment updated');
          this.commentUpdated.emit(updated);
          this.submittingEdit.set(false);
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Failed to update comment', err);
          this.submittingEdit.set(false);
          if (err?.status === 422) {
            this.editError.set('Comment content is not valid. Please revise and try again.');
          } else if (err?.status === 429) {
            this.editError.set('Too many attempts. Please wait a moment and retry.');
          } else {
            this.editError.set('Unable to update this comment right now.');
          }
        },
      });
  }

  trackByCommentId(_index: number, comment: Comment): number {
    return comment.id;
  }

  onCommentCreated(comment: Comment): void {
    this.commentCreated.emit(comment);
  }
}
