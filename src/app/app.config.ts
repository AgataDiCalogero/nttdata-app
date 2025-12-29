import { LayoutModule } from '@angular/cdk/layout';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';

import { routes } from './app.routes';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor/api-prefix.interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor/error.interceptor';
import { providePaginationConfig } from './shared/config/pagination.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation(),
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiPrefixInterceptor, authInterceptor, errorInterceptor]),
    ),
    importProvidersFrom(LayoutModule, MatIconModule),
    provideAnimations(),
    providePaginationConfig(),
  ],
};
