import { Component } from '@angular/core';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrls: ['./theme-toggle.scss'],
  imports: [LucideAngularModule],
})
export class ThemeToggle {
  // Available theme icons
  readonly Sun = Sun;
  readonly Moon = Moon;

  isLight = false;

  toggleTheme() {
    this.isLight = !this.isLight;

    if (this.isLight) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }
}
