import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Navbar } from './shared/layout/navbar/navbar.component';
import { FloatingMenuTriggerComponent } from './shared/layout/navbar/floating-menu-trigger.component';
import { ToastComponent } from './shared/ui';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { AuthService } from './core/auth/auth-service/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, FloatingMenuTriggerComponent, ToastComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly title = signal('nttdata-app');

  readonly isLoginRoute = signal(
    globalThis?.location?.pathname
      ? globalThis.location.pathname.startsWith('/login')
      : this.router.url.startsWith('/login'),
  );
  // Mobile breakpoint matches the SCSS media query (max-width: 62rem)
  readonly isMobile = signal(
    Boolean(globalThis?.window && globalThis.window.matchMedia?.('(max-width: 62rem)')?.matches),
  );
  readonly isLogged = computed(() => this.auth.token() !== null);
  readonly showFloatingMenuTrigger = computed(
    () => !this.isLoginRoute() && this.isLogged() && this.isMobile(),
  );

  ngOnInit(): void {
    // Keep a live isMobile signal in sync with viewport changes so template can conditionally render
    try {
      const win = globalThis.window as Window | undefined;
      const doc = globalThis.document as Document | undefined;
      if (!win) return;

      // Compute breakpoint in pixels based on root font-size so `62rem` matches SCSS
      const rootFontSize = doc
        ? Number.parseFloat(getComputedStyle(doc.documentElement).fontSize || '16')
        : 16;
      const breakpointPx = 62 * (Number.isFinite(rootFontSize) ? rootFontSize : 16);

      const update = () => this.isMobile.set(win.innerWidth <= breakpointPx);

      // initialize
      update();

      win.addEventListener('resize', update, { passive: true });
      this.destroyRef.onDestroy(() => {
        try {
          win.removeEventListener('resize', update);
        } catch {
          // ignore
        }
      });
    } catch {
      // server-rendered or unsupported environment
    }

    // Update isLoginRoute on navigation
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.isLoginRoute.set(event.urlAfterRedirects.startsWith('/login'));
      });
  }
}
