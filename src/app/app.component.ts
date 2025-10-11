import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/layout/navbar/navbar.component';
import { ToastComponent } from './shared/ui/toast';
import { FooterComponent } from './shared/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, ToastComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('nttdata-app');
}
