import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/layout/navbar/navbar.component';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ToastComponent, FooterComponent, LoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
