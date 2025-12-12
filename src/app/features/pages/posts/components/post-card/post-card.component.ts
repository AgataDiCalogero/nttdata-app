import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewChecked,
  ViewChild,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import type { Comment as ModelComment, Post } from '@/app/shared/models/post';

import { PostCommentsComponent } from '../post-comments/post-comments.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    ButtonComponent,
    PostCommentsComponent,
    TranslatePipe,
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent implements AfterViewChecked {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly i18n = inject(I18nService);

  @ViewChild('commentsSection') commentsSection?: ElementRef<HTMLElement>;

  readonly post = input.required<Post>();
  readonly isDeleting = input(false);
  readonly comments = input<ModelComment[]>([]);
  readonly commentsLoading = input(false);
  readonly authorName = input<string | null>(null);
  readonly commentsLoaded = input(false);
  readonly commentsPreviewCount = input<number | null | undefined>(undefined);
  readonly allowManage = input(true);
  readonly author = computed(() => {
    const provided = this.authorName();
    if (provided) return provided;

    const current = this.post();
    if (!current) {
      return this.i18n.translate('postCard.unknownAuthor');
    }

    const fallback = this.i18n.translate('userDetail.avatarFallback');
    return `${fallback} #${current.user_id}`;
  });

  readonly delete = output<void>();
  readonly toggleComments = output<void>();
  readonly edit = output<void>();
  readonly viewAuthor = output<number>();
  readonly commentCreated = output<ModelComment>();
  readonly commentUpdated = output<ModelComment>();
  readonly commentDeleted = output<number>();

  get commentCount(): number {
    const preview = this.commentsPreviewCount();
    if (typeof preview === 'number' && preview >= 0) return preview;
    return this.comments().length;
  }

  isExpanded = false;
  private pendingCommentsReveal = false;

  openSection: 'none' | 'comments' | 'composer' = 'none';

  shouldTruncate(): boolean {
    const body = this.post()?.body || '';
    return body.length > 220;
  }

  previewText(): string {
    return this.preview(undefined, 220);
  }

  preview(text?: string, max = 220): string {
    const body = text ?? this.post()?.body ?? '';
    if (body.length <= max) {
      return body;
    }

    const truncated = body.slice(0, max);
    return truncated.replace(/\s+\S*$/, '') + '...';
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }

  bodyId(): string {
    const current = this.post();
    return `post-body-${current?.id ?? 'unknown'}`;
  }

  openCommentsList(): void {
    if (this.openSection === 'composer') {
      this.openSection = 'none';
    }

    if (this.openSection === 'comments') {
      this.openSection = 'none';

      const current = this.post();
      if (current) this.toggleComments.emit();
      return;
    }

    this.openSection = 'comments';

    const current = this.post();
    if (current && !this.commentsLoaded()) {
      this.toggleComments.emit();
    }
  }

  openComposer(): void {
    if (this.openSection === 'comments') {
      this.openSection = 'none';
    }

    if (this.openSection === 'composer') {
      this.openSection = 'none';
      return;
    }

    this.openSection = 'composer';

    const current = this.post();
    if (current && !this.commentsLoaded() && !this.commentsLoading()) {
      this.pendingCommentsReveal = true;
      this.toggleComments.emit();
    }
  }

  onInternalCommentCreated(comment: ModelComment): void {
    this.commentCreated.emit(comment);
  }

  onInternalCommentUpdated(comment: ModelComment): void {
    this.commentUpdated.emit(comment);
  }

  onInternalCommentDeleted(commentId: number): void {
    this.commentDeleted.emit(commentId);
  }

  onComposerCancelledFromChild(): void {
    if (this.openSection === 'composer') {
      this.openSection = 'none';
    }
  }

  ngAfterViewChecked(): void {
    if (!this.isBrowser) {
      this.pendingCommentsReveal = false;
      return;
    }
    if (this.pendingCommentsReveal && this.commentsSection) {
      this.pendingCommentsReveal = false;
      this.focusComments();
    }
  }

  onAuthorClick(): void {
    const current = this.post();
    if (current) {
      this.viewAuthor.emit(current.user_id);
    }
  }

  private focusComments(): void {
    if (!this.isBrowser) return;
    const element = this.commentsSection?.nativeElement;
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.querySelector('textarea')?.focus();
  }
}
