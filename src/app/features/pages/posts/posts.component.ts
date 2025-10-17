import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { PostsViewComponent } from './components/posts-view/posts-view.component';
import { providePostsService, injectPostsService } from './store/posts.inject';
import { PostForm } from './components/post-form/post-form.component';
import { DeleteConfirmComponent } from '@/app/shared/dialog/delete-confirm/delete-confirm.component';
import type { Post, Comment, DeleteConfirmData } from '@/app/shared/models';
// Dialog result shape used by PostForm dialog
type DialogResult = { status: 'created' | 'updated'; post?: Post };

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostsViewComponent],
  templateUrl: './posts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [providePostsService()],
})
export class Posts {
  private readonly store = injectPostsService();
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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

  get searchForm() {
    return this.store.searchForm();
  }

  get userOptions() {
    return this.store.userOptions();
  }

  get loading() {
    return this.store.loading();
  }

  get error() {
    return this.store.error();
  }

  get posts() {
    return this.store.posts();
  }

  get commentsMap() {
    return this.store.commentsMap();
  }

  get commentsLoading() {
    return this.store.commentsLoading();
  }

  get userLookup() {
    return this.store.userLookup();
  }

  get perPageOptions() {
    return this.store.perPageOptions();
  }

  get currentPage() {
    return this.store.currentPage();
  }

  get totalPages() {
    return this.store.totalPages();
  }

  get currentPerPage() {
    return this.store.currentPerPage();
  }

  get hasPagination() {
    return this.store.hasPagination();
  }

  get deletingId() {
    return this.store.deletingId();
  }

  get postsCount() {
    return this.store.postsCount();
  }

  handleCreatePost(): void {
    const isMobile = window.innerWidth < 640;
    const baseConfig = isMobile
      ? {
          position: { right: '0', top: '0' },
          height: '100%',
          width: '480px',
          maxWidth: '100vw',
          panelClass: 'slide-in-drawer',
          backdropClass: 'blurred-backdrop',
          ariaLabel: 'New post',
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        }
      : {
          width: '620px',
          maxWidth: '90vw',
          backdropClass: 'blurred-backdrop',
          panelClass: 'user-form-modal',
          ariaLabel: 'New post',
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        };

    const ref = this.dialog.open(PostForm, {
      ...baseConfig,
      data: { users: this.store.userOptions() },
    });

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
    const isMobile = window.innerWidth < 640;
    const baseConfig = isMobile
      ? {
          position: { right: '0', top: '0' },
          height: '100%',
          width: '480px',
          maxWidth: '100vw',
          panelClass: 'slide-in-drawer',
          backdropClass: 'blurred-backdrop',
          ariaLabel: `Edit post ${post.title}`,
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        }
      : {
          width: '620px',
          maxWidth: '90vw',
          backdropClass: 'blurred-backdrop',
          panelClass: 'user-form-modal',
          ariaLabel: `Edit post ${post.title}`,
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        };

    const ref = this.dialog.open(PostForm, {
      ...baseConfig,
      data: { users: this.store.userOptions(), post },
    });

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
    };

    const ref = this.dialog.open(DeleteConfirmComponent, {
      width: '420px',
      maxWidth: '90vw',
      backdropClass: 'blurred-backdrop',
      panelClass: 'user-form-modal',
      ariaLabel: 'Delete post confirmation',
      autoFocus: true,
      restoreFocus: true,
      data,
    });

    ref.closed.subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.deletePost(post);
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
