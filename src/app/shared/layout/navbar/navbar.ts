import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { AuthService } from '../../../core/auth/auth-service/auth-service';

// Main application navbar with navigation and authentication
@Component({
  selector: 'app-navbar',
  imports: [RouterModule, ThemeToggle],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);
  private auth = inject(AuthService);

  get isLogged(): boolean {
    return this.auth.token() !== null;
  }

  logout() {
    this.auth.clearToken();
    this.router.navigate(['/login']);
  }
}
