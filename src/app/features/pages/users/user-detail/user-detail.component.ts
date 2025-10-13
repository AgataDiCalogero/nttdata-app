import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import type { User, Post, Comment } from '@/app/shared/models';
import { PostCardComponent } from '@/app/features/pages/posts/components/post-card/post-card.component';
import { ButtonComponent } from '@/app/shared/ui/button/button.component';
import { LucideAngularModule, Mail, User as UserIcon, MessageSquare } from 'lucide-angular';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, PostCardComponent, LucideAngularModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(UsersApiService);
  private readonly postsApi = inject(PostsApiService);

  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly MessageSquare = MessageSquare;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly posts = signal<Post[]>([]);

  private readonly commentsMap = signal<Record<number, Comment[]>>({});
  private readonly commentsLoading = signal<Record<number, boolean>>({});

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    if (!id) {
      this.error.set('Invalid user ID');
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
        this.error.set('Unable to load user details');
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadUserPosts(userId: number): void {
    this.postsApi.list({ user_id: userId, per_page: 50 }).subscribe({
      next: ({ items }) => this.posts.set(items ?? []),
      error: (err) => {
        console.error('Failed to load posts for user:', err);
        this.error.set('Unable to load user posts');
      },
    });
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap()[postId];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading()[postId]);
  }

  onToggleComments(postId: number): void {
    const current = this.commentsMap()[postId];
    if (current) {
      const next = { ...this.commentsMap() };
      delete next[postId];
      this.commentsMap.set(next);
      return;
    }

    this.commentsLoading.update((state) => ({ ...state, [postId]: true }));
    this.postsApi.listComments(postId).subscribe({
      next: (comments) => {
        this.commentsMap.update((state) => ({ ...state, [postId]: comments ?? [] }));
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      },
      complete: () => {
        this.commentsLoading.update((state) => ({ ...state, [postId]: false }));
      },
    });
  }

  onCommentCreated(postId: number, comment: Comment): void {
    this.commentsMap.update((state) => {
      const current = state[postId] ?? [];
      return { ...state, [postId]: [comment, ...current] };
    });
  }

  onCommentUpdated(postId: number, comment: Comment): void {
    this.commentsMap.update((state) => {
      const current = state[postId];
      if (!current) {
        return state;
      }
      return {
        ...state,
        [postId]: current.map((existing) => (existing.id === comment.id ? comment : existing)),
      };
    });
  }

  onCommentDeleted(postId: number, commentId: number): void {
    this.commentsMap.update((state) => {
      const current = state[postId];
      if (!current) {
        return state;
      }
      return {
        ...state,
        [postId]: current.filter((existing) => existing.id !== commentId),
      };
    });
  }

  trackPostId(_idx: number, post: Post): number {
    return post.id;
  }
}
