import { InjectionToken, Provider, inject } from '@angular/core';

import type { PostsService } from './posts.service';
import { PostsStoreAdapter } from './posts.store';

export const postsServiceInjectionToken = new InjectionToken<PostsService>('posts-service');

export function providePostsService(): Provider {
  return {
    provide: postsServiceInjectionToken,
    useFactory: () => new PostsStoreAdapter(),
  };
}

export function injectPostsService(): PostsService {
  return inject(postsServiceInjectionToken);
}
