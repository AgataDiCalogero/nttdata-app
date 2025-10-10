import { Component, inject, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { AppearanceSwitcherComponent } from '../appearance-switcher/appearance-switcher.component';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { Subscription } from 'rxjs';

// Main application navbar with navigation and authentication
@Component({
  selector: 'app-navbar',
  imports: [RouterModule, AppearanceSwitcherComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class Navbar implements OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  // simple local state for mobile menu
  menuOpen = false;
  isLoginRoute = false;
  private routerSub?: Subscription;

  get isLogged(): boolean {
    return this.auth.token() !== null;
  }

  logout() {
    this.auth.clearToken();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (!this.isBrowser) return;

    const body = this.document?.body;
    if (!body) return;

    if (this.menuOpen) {
      body.classList.add('mobile-menu-open');
    } else {
      body.classList.remove('mobile-menu-open');
    }
  }

  constructor() {
    this.isLoginRoute = this.router.url.startsWith('/login');
    // close menu on navigation events
    this.routerSub = this.router.events.subscribe((event) => {
      if (this.menuOpen) {
        this.menuOpen = false;
        if (this.isBrowser) {
          this.document?.body?.classList.remove('mobile-menu-open');
        }
      }

      if (event instanceof NavigationEnd) {
        this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (this.isBrowser) {
      this.document?.body?.classList.remove('mobile-menu-open');
    }
  }
}
