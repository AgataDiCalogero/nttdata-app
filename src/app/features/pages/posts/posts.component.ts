import { isPlatformBrowser, ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, effect, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import type { Post } from '@/app/shared/models/post';

import { PostsViewComponent } from './components/posts-view/posts-view.component';
import { PostCommentsDialogService } from './services/post-comments-dialog.service';
import { PostsFiltersService } from './services/posts-filters.service';
import { PostsUiService } from './services/posts-ui.service';
import { providePostsService, injectPostsService } from './store/posts.inject';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [PostsViewComponent],
  templateUrl: './posts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [providePostsService(), PostsUiService, PostsFiltersService],
})
export class Posts {
  protected readonly store = injectPostsService();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewport = inject(ViewportScroller);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly ui = inject(PostsUiService);
  private readonly commentsDialog = inject(PostCommentsDialogService);
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

    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      this.store.currentPage();
      this.store.currentPerPage();
      this.viewport.scrollToPosition([0, 0]);
    });
  }

  handleCreatePost(): void {
    this.ui.openCreateDialog();
  }

  handleResetFilters(): void {
    this.store.resetFilters();
  }

  handleEditPost(post: Post): void {
    this.ui.openEditDialog(post);
  }

  handleDeletePost(post: Post): void {
    this.ui.confirmDelete(post);
  }

  handleRetry(): void {
    this.store.refresh();
  }

  handleViewComments(post: Post): void {
    const authorName = this.store.userLookup()[post.user_id] ?? null;
    this.commentsDialog.open(post, authorName);
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
