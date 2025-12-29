import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LucideAngularModule, Sun, Moon, BookOpenCheck } from 'lucide-angular';

import { ClickOutsideDirective } from '@app/shared/directives/click-outside.directive';
import { EscapeKeyDirective } from '@app/shared/directives/escape-key.directive';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-appearance-switcher',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatSlideToggleModule,
    ButtonComponent,
    ClickOutsideDirective,
    EscapeKeyDirective,
    TranslatePipe,
  ],
  templateUrl: './appearance-switcher.component.html',
  styleUrls: ['./appearance-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSwitcherComponent {
  private readonly themeService = inject(ThemeService);
  private readonly overlays = inject(UiOverlayService);
  private readonly destroyRef = inject(DestroyRef);

  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly BookOpenCheck = BookOpenCheck;

  readonly theme = this.themeService.theme;
  readonly preference = this.themeService.preference;
  readonly isLight = this.themeService.isLightTheme;
  readonly isReadingMode = this.themeService.isReadingMode;
  readonly isLightPreference = computed(() => this.preference() === 'light');
  readonly isDarkPreference = computed(() => this.preference() === 'dark');
  readonly menuOpen = signal(false);

  readonly currentIcon = computed(() => {
    return this.isLight() ? this.Sun : this.Moon;
  });

  setPreference(theme: 'light' | 'dark'): void {
    this.themeService.setPreference(theme);
    this.closeMenu();
  }

  toggleReadingMode(): void {
    this.themeService.toggleReadingMode();
  }

  toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }
    this.overlays.activate({
      key: 'appearance-menu',
      close: () => this.closeMenu(),
      blockGlobalControls: false,
    });
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    this.overlays.release('appearance-menu');
  }

  onDocumentClick(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }

  onEscape(): void {
    this.closeMenu();
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.closeMenu());
  }
}
