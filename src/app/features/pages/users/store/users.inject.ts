import { InjectionToken, Provider, inject } from '@angular/core';

import type { UsersService } from './users.service';
import { UsersStoreAdapter } from './users.store';

export const usersServiceInjectionToken = new InjectionToken<UsersService>('users-service');

export function provideUsersService(): Provider {
  return {
    provide: usersServiceInjectionToken,
    useClass: UsersStoreAdapter,
  };
}

export function injectUsersService(): UsersService {
  return inject(usersServiceInjectionToken);
}
