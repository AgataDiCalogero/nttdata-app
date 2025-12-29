import { InjectionToken } from '@angular/core';

export interface PostsStoreConfig {
  debounceMs: number;
}

export const DEFAULT_POSTS_STORE_CONFIG: PostsStoreConfig = {
  debounceMs: 300,
};

export const POSTS_STORE_CONFIG = new InjectionToken<PostsStoreConfig>('POSTS_STORE_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_POSTS_STORE_CONFIG,
});
