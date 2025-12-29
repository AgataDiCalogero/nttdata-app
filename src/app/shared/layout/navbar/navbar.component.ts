import { BreakpointObserver } from '@angular/cdk/layout';
import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Menu } from 'lucide-angular';
import { filter } from 'rxjs';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { LucideMatIconService } from '@app/shared/icons/lucide-mat-icon.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { ThemeService } from '@/app/shared/services/theme/theme.service';
import { LanguageSwitcherComponent } from '@/app/shared/ui/language-switcher/language-switcher.component';

import { AppearanceSwitcherComponent } from '../appearance-switcher/appearance-switcher.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    NgOptimizedImage,
    AppearanceSwitcherComponent,
    LanguageSwitcherComponent,
    TranslatePipe,
    MatToolbarModule,
    ButtonComponent,
    MatIconModule,
    MatMenuModule,
    LucideAngularModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
  private readonly themeService = inject(ThemeService);
  private readonly _lucideIcons = inject(LucideMatIconService);

  @ViewChild(MatMenuTrigger) private readonly menuTrigger?: MatMenuTrigger;

  readonly currentUrl = signal(this.router.url || '/');
  readonly isLoginRoute = computed(() => this.currentUrl().startsWith('/login'));
  readonly isMobile = signal(false);
  readonly isLogged = computed(() => this.auth.token() !== null);
  readonly menuOpen = signal(false);
  readonly Menu = Menu;

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
        this.currentUrl.set(event.urlAfterRedirects || '/');
        this.syncBodyClass(this.isLoginRoute());
        this.closeMenu();
      });
  }

  isRouteActive(path: string): boolean {
    const current = this.currentUrl();
    if (path === '/') return current === '/' || current === '';
    return current === path || current.startsWith(`${path}/`) || current.startsWith(`${path}?`);
  }

  ariaCurrent(path: string): 'page' | null {
    return this.isRouteActive(path) ? 'page' : null;
  }

  logout(): void {
    this.auth.logout();
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
    this.themeService.toggleBodyClass('login-route', isLogin);
  }
}
