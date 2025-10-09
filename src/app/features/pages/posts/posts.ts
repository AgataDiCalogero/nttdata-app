import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsApiService } from './posts-api.service';
import type { Post } from '@app/models';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './posts.html',
  styleUrls: ['./posts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Posts {
  private api = inject(PostsApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  posts = signal<Post[]>([]);

  constructor() {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.posts.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load posts:', err);
        this.error.set('Impossibile caricare i post');
        this.loading.set(false);
      },
    });
  }

  trackById(_idx: number, item: Post): number {
    return item.id;
  }
}
