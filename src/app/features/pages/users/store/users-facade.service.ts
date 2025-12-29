import { inject, Injectable } from '@angular/core';
import { catchError, map, of, type Observable } from 'rxjs';

import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

@Injectable({ providedIn: 'root' })
export class UsersFacadeService {
  private readonly usersApi = inject(UsersApiService);
  private readonly postsApi = inject(PostsApiService);
  private readonly notifications = inject(NotificationsService);
  private readonly i18n = inject(I18nService);

  loadUserById(
    id: number,
    errorMessage?: string,
    options?: { silent?: boolean },
  ): Observable<User | null> {
    const resolvedErrorMessage = errorMessage ?? this.i18n.translate('userDetail.unableToLoadUser');
    return this.usersApi.getById(id, { skipGlobalError: options?.silent === true }).pipe(
      catchError((err) => {
        this.notifications.showHttpError(err, resolvedErrorMessage, options);
        return of(null as User | null);
      }),
    );
  }

  loadPostsForUser(
    userId: number,
    perPage: number,
    errorMessage?: string,
    options?: { silent?: boolean },
  ): Observable<Post[]> {
    const resolvedErrorMessage =
      errorMessage ?? this.i18n.translate('userDetail.unableToLoadPosts');
    return this.postsApi
      .list({ userId, perPage }, { skipGlobalError: options?.silent === true })
      .pipe(
        map((result) => result.items),
        catchError((err) => {
          this.notifications.showHttpError(err, resolvedErrorMessage, options);
          return of<Post[]>([]);
        }),
      );
  }
}
