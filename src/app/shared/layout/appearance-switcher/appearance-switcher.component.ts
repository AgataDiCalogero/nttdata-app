import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LucideAngularModule, Sun, Moon, BookOpenCheck } from 'lucide-angular';

import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-appearance-switcher',
  standalone: true,
  imports: [LucideAngularModule, MatMenuModule, MatSlideToggleModule, ButtonComponent],
  templateUrl: './appearance-switcher.component.html',
  styleUrls: ['./appearance-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSwitcherComponent {
  private readonly themeService = inject(ThemeService);

  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly BookOpenCheck = BookOpenCheck;

  readonly theme = this.themeService.theme;
  readonly preference = this.themeService.preference;
  readonly isLight = this.themeService.isLightTheme;
  readonly isReadingMode = this.themeService.isReadingMode;
  readonly isLightPreference = computed(() => this.preference() === 'light');
  readonly isDarkPreference = computed(() => this.preference() === 'dark');

  readonly currentIcon = computed(() => {
    return this.isLight() ? this.Sun : this.Moon;
  });

  setPreference(theme: 'light' | 'dark'): void {
    this.themeService.setPreference(theme);
  }

  toggleReadingMode(): void {
    this.themeService.toggleReadingMode();
  }
}
