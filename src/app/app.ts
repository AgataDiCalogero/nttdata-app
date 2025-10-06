import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/layout/navbar/navbar';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { apiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  providers: [
    { provide: HTTP_INTERCEPTORS, useValue: apiPrefixInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useValue: errorInterceptor, multi: true },
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('nttdata-app');
}
