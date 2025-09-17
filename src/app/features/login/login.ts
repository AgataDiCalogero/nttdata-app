import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth-service';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  token: string = '';
  private router = inject(Router);
  private auth = inject(AuthService);

  constructor() {}

  onSubmit() {
    if (this.token.trim()) {
      this.auth.setToken(this.token);
      this.router.navigate(['/users']);
    }
  }
}
