import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { AppearanceSwitcherComponent } from '../appearance-switcher/appearance-switcher.component';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { filter, map, startWith, tap } from 'rxjs';

// Main application navbar with navigation and authentication
@Component({
  selector: 'app-navbar',
  imports: [RouterModule, AppearanceSwitcherComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'banner',
    '[attr.data-menu-open]': 'menuOpen() ? "true" : "false"',
  },
})
export class Navbar implements OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

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

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser) return;
    if (window.innerWidth >= 640) {
      this.closeMenu(false);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.document?.body?.classList.remove('mobile-menu-open');
    }
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
