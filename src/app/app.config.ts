import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { providePaginationConfig } from './shared/config/pagination.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiPrefixInterceptor,
        authInterceptor,
        errorInterceptor,
        loadingInterceptor,
      ]),
    ),
    importProvidersFrom(LayoutModule, MatIconModule),
    provideAnimations(),
    providePaginationConfig(),
  ],
};
