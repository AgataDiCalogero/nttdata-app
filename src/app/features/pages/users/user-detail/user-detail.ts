import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UsersApiService } from '../services/users-api-service';
import { PostsApiService } from '../../posts/posts-api.service';
import type { User, Post, Comment } from '@app/models';
import { CommentForm } from '../../../shared/comments/comment-form/comment-form';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CommentForm],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail {
  private route = inject(ActivatedRoute);
  private usersApi = inject(UsersApiService);
  private postsApi = inject(PostsApiService);

  loading = signal(true);
  error = signal<string | null>(null);
  user = signal<User | null>(null);
  posts = signal<Post[]>([]);

  // commentsMap stores loaded comments per post id
  commentsMap = signal<Record<number, Comment[]>>({});
  commentsLoading = signal<Record<number, boolean>>({});

  constructor() {
    this.init();
  }

  private init(): void {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    if (!id) {
      this.error.set('User ID non valido');
      this.loading.set(false);
      return;
    }

    this.loadUser(id);
    this.loadUserPosts(id);
  }

  private loadUser(id: number): void {
    this.usersApi.getById(id).subscribe({
      next: (u) => this.user.set(u),
      error: (err) => {
        console.error('Failed to load user:', err);
        this.error.set('Impossibile caricare i dettagli utente');
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadUserPosts(userId: number): void {
    this.postsApi.list({ user_id: userId, per_page: 50 }).subscribe({
      next: (result) => this.posts.set(result.data ?? []),
      error: (err) => {
        console.error('Failed to load posts for user:', err);
        this.error.set("Impossibile caricare i post dell'utente");
      },
    });
  }

  // Toggle comments for a post: if not loaded, fetch them
  toggleComments(postId: number): void {
    const loaded = this.commentsMap()[postId];
    if (loaded) {
      // hide comments
      const copy = { ...this.commentsMap() };
      delete copy[postId];
      this.commentsMap.set(copy);
      return;
    }

    // mark loading
    this.commentsLoading.update((s) => ({ ...s, [postId]: true }));

    this.postsApi.listComments(postId).subscribe({
      next: (comments) => {
        this.commentsMap.update((m) => ({ ...m, [postId]: comments ?? [] }));
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      },
      complete: () => {
        this.commentsLoading.update((s) => ({ ...s, [postId]: false }));
      },
    });
  }

  onCommentCreated(postId: number, comment: Comment): void {
    this.commentsMap.update((state) => {
      const current = state[postId] ?? [];
      return { ...state, [postId]: [comment, ...current] };
    });
  }

  trackById(_idx: number, item: Post): number {
    return item.id;
  }
}
