import { InjectionToken, Provider, inject } from '@angular/core';

import { PostsStoreAdapter } from './posts.store';
import type { PostsService } from '../services/posts.service';

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
