import { Component, inject, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { AuthService } from '../../../core/auth/auth-service/auth-service';
import { Subscription } from 'rxjs';

// Main application navbar with navigation and authentication
@Component({
  selector: 'app-navbar',
  imports: [RouterModule, ThemeToggle],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  // simple local state for mobile menu
  menuOpen = false;
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
    // lock body scroll when menu is open
    const isBrowser = isPlatformBrowser(this.platformId);
    if (!isBrowser) return;

    if (this.menuOpen) {
      this.document?.body?.classList.add('mobile-menu-open');
    } else {
      this.document?.body?.classList.remove('mobile-menu-open');
    }
  }

  constructor() {
    // close menu on navigation events
    const isBrowser = isPlatformBrowser(this.platformId);
    this.routerSub = this.router.events.subscribe(() => {
      if (this.menuOpen) {
        this.menuOpen = false;
        if (isBrowser) {
          this.document?.body?.classList.remove('mobile-menu-open');
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    const isBrowser = isPlatformBrowser(this.platformId);
    if (isBrowser) {
      this.document?.body?.classList.remove('mobile-menu-open');
    }
  }
}
