import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  token: string = '';
  constructor(private router: Router) {}

  onSubmit() {
    if (this.token.trim()) {
      localStorage.setItem('auth_token', this.token);
      this.router.navigate(['/users']);
    }
  }
}
