import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withInterceptors([apiPrefixInterceptor, authInterceptor, errorInterceptor])),
    importProvidersFrom(LayoutModule, MatIconModule),
    provideAnimations(),
  ],
};
