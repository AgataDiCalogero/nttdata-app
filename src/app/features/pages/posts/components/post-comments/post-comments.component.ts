import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommentFormComponent } from '@/app/shared/comments/comment-form/comment-form.component';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import type { Comment as ModelComment, DeleteConfirmData } from '@/app/shared/models';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { LoaderComponent } from '@app/shared/ui/loader/loader.component';
import { LucideAngularModule, Pencil, X, Trash2 } from 'lucide-angular';
import { DeleteConfirmComponent } from '@/app/shared/dialog/delete-confirm/delete-confirm.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, take } from 'rxjs';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';

@Component({
  standalone: true,
  selector: 'app-post-comments',
  imports: [
    CommonModule,
    CommentFormComponent,
    ReactiveFormsModule,
    ButtonComponent,
    AlertComponent,
    LoaderComponent,
    LucideAngularModule,
  ],
  templateUrl: './post-comments.component.html',
  styleUrls: ['./post-comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCommentsComponent {
  readonly comments = input<ModelComment[] | null | undefined>(null);
  readonly loading = input(false);
  readonly postId = input.required<number>();

  readonly hideComposer = input(false);

  readonly commentCreated = output<ModelComment>();
  readonly commentUpdated = output<ModelComment>();
  readonly commentDeleted = output<number>();
  readonly composerCancelled = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly postsApi = inject(PostsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlays = inject(UiOverlayService);

  readonly Pencil = Pencil;
  readonly X = X;
  readonly Trash2 = Trash2;
  private readonly dialog = inject(Dialog);
  readonly deletingId = signal<number | null>(null);
  deleteComment(comment: ModelComment): void {
    const data: DeleteConfirmData = {
      title: 'Delete Comment',
      message: `Are you sure you want to delete this comment? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      inProgressText: 'Deleting...',
      errorMessage: 'Unable to delete this comment right now.',
      confirmAction: () => {
        this.deletingId.set(comment.id);
        return this.postsApi.deleteComment(comment.id).pipe(
          takeUntilDestroyed(this.destroyRef),
          tap({
            next: () => {
              this.toast.show('success', 'Comment deleted');
              this.commentDeleted.emit(comment.id);
              this.deletingId.set(null);
            },
            error: (err) => {
              this.deletingId.set(null);
              console.error('Failed to delete comment', err);
              const message =
                err?.status === 429
                  ? 'Too many attempts. Please wait and retry.'
                  : 'Unable to delete this comment right now.';
              this.toast.show('error', message);
              throw new Error(message);
            },
          }),
        );
      },
    };
    const ref = this.dialog.open(DeleteConfirmComponent, {
      width: '400px',
      maxWidth: '90vw',
      backdropClass: 'app-dialog-overlay',
      panelClass: 'app-dialog-panel',
      ariaLabel: 'Delete comment confirmation',
      autoFocus: true,
      restoreFocus: true,
      data,
    });
    this.overlays.activate({
      key: 'comment-delete-confirm',
      close: () => ref.close(),
      blockGlobalControls: true,
    });
    ref.closed.pipe(take(1)).subscribe(() => {
      this.overlays.release('comment-delete-confirm');
    });
  }

  readonly editingId = signal<number | null>(null);
  readonly submittingEdit = signal(false);
  readonly editError = signal<string | null>(null);

  readonly editForm = this.fb.nonNullable.group({
    body: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(5)]),
  });

  startEdit(comment: ModelComment): void {
    this.editingId.set(comment.id);
    this.editError.set(null);
    this.editForm.reset({ body: comment.body });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editError.set(null);
    this.editForm.reset();
  }

  saveEdit(comment: ModelComment): void {
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
        next: (updated: ModelComment) => {
          this.toast.show('success', 'Comment updated');
          this.commentUpdated.emit(updated);
          this.submittingEdit.set(false);
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Failed to update comment', err);
          this.submittingEdit.set(false);
          if (err?.status === 422) {
            // Keep inline validation errors for the edit form
            this.editError.set('Comment content is not valid. Please revise and try again.');
          } else if (err?.status === 429) {
            // Rate limit / server-level error -> show centralized toast
            this.toast.show('error', 'Too many attempts. Please wait a moment and retry.');
          } else {
            this.toast.show('error', 'Unable to update this comment right now.');
          }
        },
      });
  }

  trackByCommentId(_index: number, comment: ModelComment): number {
    return comment.id;
  }

  onCommentCreated(comment: ModelComment): void {
    this.commentCreated.emit(comment);
  }

  onComposerCancelled(): void {
    this.composerCancelled.emit();
  }
}
