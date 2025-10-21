import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { PostsViewComponent } from './components/posts-view/posts-view.component';
import { providePostsService, injectPostsService } from './store/posts.inject';
import { PostForm } from './components/post-form/post-form.component';
import { DeleteConfirmComponent } from '@/app/shared/dialog/delete-confirm/delete-confirm.component';
import type { Post, Comment, DeleteConfirmData, User } from '@/app/shared/models';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
// Dialog result shape used by PostForm dialog
type DialogResult = { status: 'created' | 'updated'; post?: Post };
type PostFormDialogData = { users: User[]; post?: Post };

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostsViewComponent],
  templateUrl: './posts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [providePostsService()],
})
export class Posts {
  protected readonly store = injectPostsService();
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogLayouts = inject(ResponsiveDialogService);
  private lastSyncedPage = 1;
  private lastSyncedPerPage = 10;

  constructor() {
    this.lastSyncedPage = Number(this.route.snapshot.queryParamMap.get('page') ?? 1);
    this.lastSyncedPerPage = Number(this.route.snapshot.queryParamMap.get('per_page') ?? 10);
    this.store.initializePaging(this.lastSyncedPage, this.lastSyncedPerPage);

    effect(() => {
      const page = this.store.currentPage();
      const perPage = this.store.currentPerPage();
      this.syncQueryParams(page, perPage);
    });
  }

  // (DialogResult type declared at module scope)

  handleCreatePost(): void {
    const config = this.dialogLayouts.form<PostFormDialogData, DialogResult, PostForm>({
      ariaLabel: 'New post',
      desktop: { width: '38.75rem' },
      data: { users: this.store.userOptions() },
    });
    const ref = this.dialog.open<DialogResult, PostFormDialogData, PostForm>(PostForm, config);

    ref.closed.subscribe((result) => {
      if (result && typeof result === 'object' && 'status' in result) {
        if (result.status === 'created') {
          this.store.setPage(1);
          this.store.refresh();
        } else if (result.status === 'updated') {
          const r = result as DialogResult;
          if (r.post) {
            this.store.onPostUpdated(r.post);
          }
        }
      }
    });
  }

  handleResetFilters(): void {
    this.store.resetFilters();
  }

  handleRefresh(): void {
    this.store.refresh();
  }

  handleToggleComments(postId: number): void {
    this.store.toggleComments(postId);
  }

  handleEditPost(post: Post): void {
    const config = this.dialogLayouts.form<PostFormDialogData, DialogResult, PostForm>({
      ariaLabel: `Edit post ${post.title}`,
      desktop: { width: '38.75rem' },
      data: { users: this.store.userOptions(), post },
    });
    const ref = this.dialog.open<DialogResult, PostFormDialogData, PostForm>(PostForm, config);

    ref.closed.subscribe((result) => {
      if (result && typeof result === 'object' && 'status' in result) {
        const r = result as DialogResult;
        if (result.status === 'updated') {
          if (r.post) {
            this.store.onPostUpdated(r.post);
          }
        } else if (result.status === 'created') {
          this.store.setPage(1);
          this.store.refresh();
        }
      }
    });
  }

  handleDeletePost(post: Post): void {
    const data: DeleteConfirmData = {
      title: 'Delete Post',
      message: `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      inProgressText: 'Deleting...',
      errorMessage: 'Unable to delete this post right now. Please try again.',
      confirmAction: () => this.store.deletePostRequest(post),
    };

    this.dialog.open(DeleteConfirmComponent, {
      width: '26.25rem',
      maxWidth: '90vw',
      backdropClass: 'blurred-backdrop',
      panelClass: 'user-form-modal',
      ariaLabel: 'Delete post confirmation',
      autoFocus: true,
      restoreFocus: true,
      data,
    });
  }

  handleCommentCreated(event: { postId: number; comment: Comment }): void {
    this.store.onCommentCreated(event.postId, event.comment);
  }

  handleCommentUpdated(event: { postId: number; comment: Comment }): void {
    this.store.onCommentUpdated(event.postId, event.comment);
  }

  handleViewAuthor(userId: number): void {
    this.router.navigate(['/users', userId]).catch(() => {});
  }

  handleChangePage(page: number): void {
    this.store.setPage(page);
  }

  handleChangePerPage(perPage: number): void {
    this.store.changePerPage(perPage);
  }

  private syncQueryParams(page: number, perPage: number): void {
    if (this.lastSyncedPage === page && this.lastSyncedPerPage === perPage) {
      return;
    }

    this.lastSyncedPage = page;
    this.lastSyncedPerPage = perPage;

    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: { page, per_page: perPage },
        queryParamsHandling: 'merge',
      })
      .catch(() => {});
  }
}
