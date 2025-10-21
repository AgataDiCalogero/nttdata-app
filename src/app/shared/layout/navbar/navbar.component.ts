import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AppearanceSwitcherComponent } from '../appearance-switcher/appearance-switcher.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { LucideAngularModule, LogOut } from 'lucide-angular';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { filter } from 'rxjs';

// Main application navbar with navigation and authentication
@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    NgOptimizedImage,
    AppearanceSwitcherComponent,
    ButtonComponent,
    LucideAngularModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
    '[attr.data-menu-open]': 'menuOpen() ? "true" : "false"',
  },
})
export class Navbar implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly desktopQuery = '(min-width: 640px)';

  readonly isLoginRoute = signal(this.router.url.startsWith('/login'));
  readonly isLogged = computed(() => this.auth.token() !== null);
  readonly menuOpen = signal(false);
  readonly isDesktop = signal(
    this.isBrowser ? this.breakpointObserver.isMatched(this.desktopQuery) : false,
  );

  // export icon for template binding
  readonly LogOut = LogOut;

  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  logout(): void {
    this.auth.clearToken();
    this.router.navigate(['/login']).catch(() => {});
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    if (!this.isBrowser) return;
    this.updateBodyScroll();
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (this.isBrowser) {
      this.updateBodyScroll();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.document?.body?.classList.remove('mobile-menu-open');
      if (this.keydownHandler) {
        try {
          this.document?.removeEventListener('keydown', this.keydownHandler);
        } catch {
          void 0;
        }
        this.keydownHandler = null;
      }
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.breakpointObserver
      .observe(this.desktopQuery)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.isDesktop.set(state.matches));

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.isLoginRoute.set(event.urlAfterRedirects.startsWith('/login'));
        this.closeMenu();
      });

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.closeMenu();
      }
    };
    this.keydownHandler = handler;

    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (this.isDesktop() && this.menuOpen()) {
          this.closeMenu();
        }
      });

      effect(() => {
        if (!this.menuOpen()) {
          try {
            this.document?.removeEventListener('keydown', handler);
          } catch {
            void 0; // ignore errors when removing handler in non-browser/test envs
          }
          return;
        }

        try {
          this.document?.addEventListener('keydown', handler);

          const nav = this.document?.getElementById('main-nav');
          const first = nav?.querySelector('a, button') as HTMLElement | null;
          if (first) {
            first.focus();
          }
        } catch {
          void 0; // ignore DOM errors in non-browser/test envs
        }
      });
    });
  }

  private updateBodyScroll(): void {
    const body = this.document?.body;
    if (!body) return;
    if (this.menuOpen()) {
      body.classList.add('mobile-menu-open');
    } else {
      body.classList.remove('mobile-menu-open');
    }
  }
}
