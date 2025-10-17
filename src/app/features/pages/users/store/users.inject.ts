import { InjectionToken, Provider, inject } from '@angular/core';
import { UsersStoreAdapter } from './users.store';
import type { UsersService } from './users.service';

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
