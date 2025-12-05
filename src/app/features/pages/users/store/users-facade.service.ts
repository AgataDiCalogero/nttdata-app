import { inject, Injectable } from '@angular/core';
import { catchError, map, of, type Observable } from 'rxjs';

import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import type { Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

@Injectable({ providedIn: 'root' })
export class UsersFacadeService {
  private readonly usersApi = inject(UsersApiService);
  private readonly postsApi = inject(PostsApiService);
  private readonly notifications = inject(NotificationsService);

  loadUserById(id: number, errorMessage = 'Unable to load user'): Observable<User | null> {
    return this.usersApi.getById(id).pipe(
      catchError((err) => {
        this.notifications.showHttpError(err, errorMessage);
        return of(null as User | null);
      }),
    );
  }

  loadPostsForUser(
    userId: number,
    perPage: number,
    errorMessage = 'Unable to load posts',
  ): Observable<Post[]> {
    return this.postsApi.list({ userId, perPage }).pipe(
      map((result) => result?.items ?? []),
      catchError((err) => {
        this.notifications.showHttpError(err, errorMessage);
        return of<Post[]>([]);
      }),
    );
  }
}
