import { Component, inject } from '@angular/core';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrls: ['./theme-toggle.scss'],
  imports: [LucideAngularModule],
})
export class ThemeToggle {
  private readonly themeService = inject(ThemeService);

  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly isLight = this.themeService.isLightTheme;

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
