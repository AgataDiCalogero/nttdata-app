import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CommentFormComponent } from '@app/shared/ui/comment-form/comment-form.component';

import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import type { Comment, Post } from '@/app/shared/models/post';

import { PostCommentsComponent } from '../post-comments/post-comments.component';

interface PostCommentsDialogData {
  post: Post;
  authorName?: string | null;
  allowManage?: boolean;
}

@Component({
  selector: 'app-post-comments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ButtonComponent,
    TranslatePipe,
    PostCommentsComponent,
    CommentFormComponent,
  ],
  templateUrl: './post-comments-dialog.component.html',
  styleUrls: ['./post-comments-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCommentsDialogComponent {
  private readonly commentsFacade = inject(CommentsFacadeService);
  private readonly i18n = inject(I18nService);
  private readonly dialogRef = inject(DialogRef<PostCommentsDialogComponent>);
  readonly data = inject(DIALOG_DATA) as PostCommentsDialogData;

  readonly comments = computed(() => this.commentsFacade.comments()[this.data.post.id] ?? []);
  readonly loading = computed(() => Boolean(this.commentsFacade.loading()[this.data.post.id]));
  readonly authorName = computed(() => {
    const provided = this.data.authorName?.trim();
    if (provided != null && provided !== '') return provided;

    const fallback = this.i18n.translate('userDetail.avatarFallback');
    const id = this.data.post.user_id;
    return `${fallback} #${id}`;
  });

  readonly ariaLabel = computed(() =>
    this.i18n.translate('postComments.dialogAria', { title: this.data.post.title }),
  );

  readonly labelText = computed(() => this.i18n.translate('postComments.dialogLabel'));
  readonly allowManage = computed(() => this.data.allowManage ?? true);

  close(): void {
    this.dialogRef.close();
  }

  onCommentCreated(comment: Comment): void {
    this.commentsFacade.applyCreated(this.data.post.id, comment);
  }

  onCommentUpdated(comment: Comment): void {
    this.commentsFacade.applyUpdated(this.data.post.id, comment);
  }

  onCommentDeleted(commentId: number): void {
    this.commentsFacade.applyDeleted(this.data.post.id, commentId);
  }
}
