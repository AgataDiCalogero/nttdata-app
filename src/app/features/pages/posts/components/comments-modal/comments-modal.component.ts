import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import type { Comment } from '@app/shared/models/post';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CommentFormComponent } from '@app/shared/ui/comment-form/comment-form.component';

import { I18nService } from '@/app/shared/i18n/i18n.service';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';

import { PostCommentsComponent } from '../post-comments/post-comments.component';

export interface CommentsModalData {
  postId: number;
}

@Component({
  standalone: true,
  selector: 'app-comments-modal',
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ButtonComponent,
    TranslatePipe,
    PostCommentsComponent,
    CommentFormComponent,
  ],
  templateUrl: './comments-modal.component.html',
  styleUrls: ['./comments-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsModalComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef);
  private readonly data = inject<CommentsModalData>(DIALOG_DATA);
  private readonly facade = inject(CommentsFacadeService);
  private readonly i18n = inject(I18nService);

  readonly postId = this.data.postId;

  // Connect to facade signals
  readonly comments = computed(() => this.facade.commentsFor(this.postId));
  readonly loading = computed(() => this.facade.isLoading(this.postId));
  readonly count = computed(() => this.comments().length);

  ngOnInit(): void {
    // Ensure comments are loaded when modal opens
    this.facade.toggleComments(this.postId);
  }

  close(): void {
    this.dialogRef.close();
  }

  onCommentCreated(comment: Comment): void {
    this.facade.applyCreated(this.postId, comment);
  }

  onCommentUpdated(comment: Comment): void {
    this.facade.applyUpdated(this.postId, comment);
  }

  onCommentDeleted(commentId: number): void {
    this.facade.applyDeleted(this.postId, commentId);
  }
}
