import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { AppearanceSwitcherComponent } from '../appearance-switcher/appearance-switcher.component';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { filter } from 'rxjs';
import { LucideMatIconService } from '@app/shared/icons/lucide-mat-icon.service';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    NgOptimizedImage,
    AppearanceSwitcherComponent,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
    '[attr.data-menu-open]': 'menuOpen() ? "true" : "false"',
  },
})
export class Navbar implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _lucideIcons = inject(LucideMatIconService);

  @ViewChild(MatMenuTrigger) private readonly menuTrigger?: MatMenuTrigger;

  // Initialize from location.pathname synchronously to avoid router timing on refresh
  readonly isLoginRoute = signal(
    globalThis?.location?.pathname?.startsWith?.('/login') ?? this.router.url.startsWith('/login'),
  );
  // helper for template binding to avoid inline object literals which can confuse the template parser
  readonly routerLinkExact = { exact: true } as const;
  readonly isLogged = computed(() => this.auth.token() !== null);
  readonly menuOpen = signal(false);

  ngOnInit(): void {
    // Ensure body class matches current route immediately to avoid visual flashes
    if (typeof document !== 'undefined') {
      if (this.isLoginRoute()) {
        document.body.classList.add('login-route');
      } else {
        document.body.classList.remove('login-route');
      }
    }
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.isLoginRoute.set(event.urlAfterRedirects.startsWith('/login'));
        this.closeMenu();
        // Toggle a body class so we can style the page for the login route (non-scrollable header etc.)
        if (typeof document !== 'undefined') {
          if (this.isLoginRoute()) {
            document.body.classList.add('login-route');
          } else {
            document.body.classList.remove('login-route');
          }
        }
      });
  }

  logout(): void {
    this.auth.clearToken();
    this.router.navigate(['/login']).catch(() => {});
  }

  onMenuOpened(): void {
    this.menuOpen.set(true);
  }

  onMenuClosed(): void {
    this.menuOpen.set(false);
  }

  closeMenu(): void {
    this.menuTrigger?.closeMenu();
    this.menuOpen.set(false);
  }
}
