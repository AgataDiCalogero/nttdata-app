import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { tap, take } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import type { Comment as ModelComment } from '@/app/shared/models/post';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';
import { UiOverlayService } from '@/app/shared/services/ui-overlay/ui-overlay.service';
import { AlertComponent } from '@/app/shared/ui/alert/alert.component';
import { ButtonComponent } from '@/app/shared/ui/button/button.component';
import { CommentFormComponent } from '@/app/shared/ui/comment-form/comment-form.component';
import { DeleteConfirmComponent } from '@/app/shared/ui/dialog/delete-confirm.component';
import { ToastService } from '@/app/shared/ui/toast/toast.service';

@Component({
  standalone: true,
  selector: 'app-post-comments',
  imports: [
    CommonModule,
    CommentFormComponent,
    ReactiveFormsModule,
    ButtonComponent,
    AlertComponent,
    MatIconModule,
    MatProgressBarModule,
    TranslatePipe,
  ],
  templateUrl: './post-comments.component.html',
  styleUrls: ['./post-comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCommentsComponent {
  readonly comments = input<ModelComment[]>([]);
  readonly loading = input(false);
  readonly postId = input.required<number>();

  readonly commentCreated = output<ModelComment>();
  readonly commentUpdated = output<ModelComment>();
  readonly commentDeleted = output<number>();

  private readonly fb = inject(FormBuilder);
  private readonly commentsFacade = inject(CommentsFacadeService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly overlays = inject(UiOverlayService);

  private readonly dialog = inject(Dialog);
  readonly deletingId = signal<number | null>(null);
  deleteComment(comment: ModelComment): void {
    const data: DeleteConfirmData = {
      title: this.i18n.translate('postComments.deleteConfirm.title'),
      message: this.i18n.translate('postComments.deleteConfirm.message'),
      confirmText: this.i18n.translate('common.actions.delete'),
      cancelText: this.i18n.translate('common.actions.cancel'),
      inProgressText: this.i18n.translate('postComments.deleteConfirm.inProgress'),
      errorMessage: this.i18n.translate('postComments.deleteConfirm.errorMessage'),
      confirmAction: () => {
        this.deletingId.set(comment.id);
        return this.commentsFacade.deleteComment(comment.id).pipe(
          tap({
            next: () => {
              this.deletingId.set(null);
              this.commentDeleted.emit(comment.id);
              this.toast.show('success', this.i18n.translate('postComments.toast.deleted'));
            },
            error: (err) => {
              this.deletingId.set(null);
              console.error('Failed to delete comment', err);
              const message =
                err?.status === 429
                  ? this.i18n.translate('postComments.errors.rateLimit')
                  : this.i18n.translate('postComments.deleteConfirm.errorMessage');
              this.toast.show('error', message);
              throw err;
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
      ariaLabel: this.i18n.translate('postComments.deleteConfirm.title'),
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

  constructor() {
    effect(() => {
      const disable = this.submittingEdit();
      const control = this.editForm.controls.body;
      if (disable && control.enabled) {
        control.disable({ emitEvent: false });
      } else if (!disable && control.disabled) {
        control.enable({ emitEvent: false });
      }
    });
  }

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

    this.commentsFacade
      .updateComment(comment.id, { body: trimmed })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          if (updated) {
            this.commentUpdated.emit(updated);
          }
          this.toast.show('success', this.i18n.translate('postComments.toast.updated'));
          this.submittingEdit.set(false);
          this.cancelEdit();
        },
        error: (err) => {
          console.error('Failed to update comment', err);
          this.submittingEdit.set(false);
          if (err?.status === 422) {
            this.editError.set(this.i18n.translate('postComments.errors.editInvalid'));
          } else if (err?.status === 429) {
            this.toast.show('error', this.i18n.translate('postComments.errors.rateLimit'));
          } else {
            this.toast.show('error', this.i18n.translate('postComments.toast.updateFailed'));
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
}
