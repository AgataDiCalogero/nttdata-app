import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { PostsViewComponent } from '../view/posts-view.component';
import { PostsStore } from '../store/posts.store';
import { PostForm } from '../post-form/post-form.component';
import {
  DeleteConfirmComponent,
  type DeleteConfirmData,
} from '../../../../shared/dialog/delete-confirm/delete-confirm.component';
import type { Post, Comment } from '@/app/shared/models';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostsViewComponent],
  templateUrl: './posts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PostsStore],
})
export class Posts {
  private readonly store = inject(PostsStore);
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

  get searchForm() {
    return this.store.searchForm;
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

  get perPageOptions() {
    return this.store.perPageOptions;
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
      if (result === 'success') {
        this.store.setPage(1);
        this.store.refresh();
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
