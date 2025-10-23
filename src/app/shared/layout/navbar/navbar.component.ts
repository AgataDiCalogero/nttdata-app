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

  // Dev-only contrast check for navbar/menu items to help ensure WCAG contrast
  // Logs ratios in console when running on localhost.
  ngAfterViewInit(): void {
    try {
      const isLocal = (globalThis as any)?.location?.hostname === 'localhost';
      if (!isLocal || typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }

      const nav = document.querySelector('.app-navbar') as HTMLElement | null;
      const sample = document.querySelector(
        '.app-navbar .nav-links a[mat-button]',
      ) as HTMLElement | null;
      if (!nav || !sample) return;

      const bg = getComputedStyle(nav).backgroundColor;
      const fg = getComputedStyle(sample).color;

      const ratio = this.#contrastRatio(fg, bg);
      // 4.5:1 for normal text, 3:1 for large. Our nav is medium; target 4.5.
      console.debug(`[A11Y] Navbar default contrast ratio: ${ratio.toFixed(2)} (target ≥ 4.5)`);

      // Create ephemeral elements to measure active and hover states
      const activeEl = sample.cloneNode(true) as HTMLElement;
      activeEl.classList.add('active');
      activeEl.style.position = 'absolute';
      activeEl.style.visibility = 'hidden';
      nav.appendChild(activeEl);
      const activeBg = getComputedStyle(activeEl).backgroundColor;
      const activeFg = getComputedStyle(activeEl).color;
      const activeRatio = this.#contrastRatio(activeFg, activeBg);
      console.debug(
        `[A11Y] Navbar active contrast ratio: ${activeRatio.toFixed(2)} (target ≥ 4.5)`,
      );

      const hoverEl = sample.cloneNode(true) as HTMLElement;
      hoverEl.style.position = 'absolute';
      hoverEl.style.visibility = 'hidden';
      // Simulate hover colors based on variables used in SCSS
      const root = document.documentElement;
      const hoverBg = getComputedStyle(root).getPropertyValue('--accent-hover')?.trim();
      hoverEl.style.background = hoverBg || '';
      hoverEl.style.color = getComputedStyle(root).getPropertyValue('--color-on-surface') || '';
      nav.appendChild(hoverEl);
      const hoverRatio = this.#contrastRatio(
        getComputedStyle(hoverEl).color,
        getComputedStyle(hoverEl).backgroundColor,
      );
      console.debug(`[A11Y] Navbar hover contrast ratio: ${hoverRatio.toFixed(2)} (target ≥ 4.5)`);

      nav.removeChild(activeEl);
      nav.removeChild(hoverEl);
    } catch {
      // ignore
    }
  }

  // Parse rgb/rgba hex colors and compute WCAG 2.1 contrast ratio
  #contrastRatio(fg: string, bg: string): number {
    const f = this.#relativeLuminance(this.#toRgb(fg));
    const b = this.#relativeLuminance(this.#toRgb(bg));
    const [L1, L2] = f > b ? [f, b] : [b, f];
    return (L1 + 0.05) / (L2 + 0.05);
  }

  #toRgb(input: string): { r: number; g: number; b: number } {
    // rgb(a) or hex #rrggbb
    const rgb = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
    const hex = input.trim();
    if (hex.startsWith('#')) {
      const v = hex.slice(1);
      const n =
        v.length === 3
          ? v
              .split('')
              .map((c) => c + c)
              .join('')
          : v;
      const num = parseInt(n, 16);
      return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
    // Fallback to black
    return { r: 0, g: 0, b: 0 };
  }

  #relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
    const srgb = [r, g, b]
      .map((v) => v / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
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
