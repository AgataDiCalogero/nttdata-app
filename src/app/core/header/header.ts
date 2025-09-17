import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { AuthService } from '../auth/auth-service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ThemeToggle],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
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
