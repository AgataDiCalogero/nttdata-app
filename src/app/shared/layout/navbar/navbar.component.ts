import {
  ChangeDetectionStrategy,
  Component,
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
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { AppearanceSwitcherComponent } from '../appearance-switcher/appearance-switcher.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { LucideAngularModule, LogOut } from 'lucide-angular';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { filter, map, startWith, tap } from 'rxjs';

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
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly desktopQuery = '(min-width: 640px)';

  private readonly routerEvents$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    tap(() => {
      if (this.menuOpen()) {
        this.closeMenu(false);
      }
    }),
    map((event) => event.urlAfterRedirects.startsWith('/login')),
    startWith(this.router.url.startsWith('/login')),
  );

  readonly isLoginRoute = toSignal(this.routerEvents$, {
    initialValue: this.router.url.startsWith('/login'),
  });
  readonly isLogged = computed(() => this.auth.token() !== null);
  readonly menuOpen = signal(false);
  readonly isDesktop = this.isBrowser
    ? toSignal(
        this.breakpointObserver
          .observe(this.desktopQuery)
          .pipe(map((state) => state.matches)),
        { initialValue: this.breakpointObserver.isMatched(this.desktopQuery) },
      )
    : signal(false);

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

  closeMenu(updateUrl = true): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    if (this.isBrowser) {
      this.updateBodyScroll();
    }
    if (updateUrl) {
      // no-op placeholder for future focus management
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

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.closeMenu();
      }
    };
    this.keydownHandler = handler;

    // effect() must run in an Angular injection context. Use runInInjectionContext
    // with the current injector so this works when invoked at runtime here.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (this.isDesktop() && this.menuOpen()) {
          this.closeMenu(false);
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
