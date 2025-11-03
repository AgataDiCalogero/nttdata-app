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
import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
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
    ButtonComponent,
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
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly document = inject(DOCUMENT);
  private readonly _lucideIcons = inject(LucideMatIconService);

  @ViewChild(MatMenuTrigger) private readonly menuTrigger?: MatMenuTrigger;

  readonly isLoginRoute = signal(this.router.url.startsWith('/login'));
  readonly isMobile = signal(false);
  readonly routerLinkExact = { exact: true } as const;
  readonly isLogged = computed(() => this.auth.token() !== null);
  readonly menuOpen = signal(false);

  ngOnInit(): void {
    this.breakpointObserver
      .observe('(max-width: 62rem)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ matches }) => this.isMobile.set(matches));

    this.syncBodyClass(this.isLoginRoute());

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const isLogin = event.urlAfterRedirects.startsWith('/login');
        this.isLoginRoute.set(isLogin);
        this.syncBodyClass(isLogin);
        this.closeMenu();
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

  private syncBodyClass(isLogin: boolean): void {
    const doc = this.document as Document | null;
    if (!doc) return;
    doc.body.classList.toggle('login-route', isLogin);
  }
}
