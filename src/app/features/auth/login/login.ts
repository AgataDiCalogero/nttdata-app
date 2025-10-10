import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { AuthService } from '../../../core/auth/auth-service/auth-service';
import { TokenHelpDialogComponent } from './token-help-dialog/token-help-dialog.component';

// Login page component for token-based authentication
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  token: string = '';
  private router = inject(Router);
  private auth = inject(AuthService);
  private dialog = inject(Dialog);

  constructor() {}

  onSubmit() {
    if (this.token.trim()) {
      this.auth.setToken(this.token);
      this.router.navigate(['/users']);
    }
  }

  openTokenHelp(): void {
    this.dialog.open(TokenHelpDialogComponent, {
      autoFocus: false,
      panelClass: 'token-help-dialog',
    });
  }
}
