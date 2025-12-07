import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LucideAngularModule, Sun, Moon, BookOpenCheck } from 'lucide-angular';

import { ClickOutsideDirective } from '@app/shared/directives/click-outside.directive';
import { EscapeKeyDirective } from '@app/shared/directives/escape-key.directive';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-appearance-switcher',
  standalone: true,
  imports: [
    LucideAngularModule,
    ClickOutsideDirective,
    EscapeKeyDirective,
    MatSlideToggleModule,
    ButtonComponent,
  ],
  templateUrl: './appearance-switcher.component.html',
  styleUrls: ['./appearance-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSwitcherComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly themeService = inject(ThemeService);
  private readonly overlays = inject(UiOverlayService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayKey = 'appearance-menu' as const;

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

  private readonly menuState = signal(false);
  readonly menuOpen = this.menuState.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.menuState()) {
        this.overlays.release(this.overlayKey);
      }
    });
  }

  toggleMenu(): void {
    if (this.menuState()) {
      this.closeMenu();
      return;
    }

    this.overlays.activate({
      key: this.overlayKey,
      close: () => this.closeMenu(),
    });
    this.menuState.set(true);
  }

  closeMenu(): void {
    if (!this.menuState()) {
      return;
    }

    this.menuState.set(false);
    this.overlays.release(this.overlayKey);
  }

  setPreference(theme: 'light' | 'dark'): void {
    this.themeService.setPreference(theme);
    this.closeMenu();
  }

  toggleReadingMode(): void {
    this.themeService.toggleReadingMode();
  }

  onDocumentClick(): void {
    if (!this.menuState()) return;
    this.closeMenu();
  }

  onEscape(): void {
    this.closeMenu();
  }
}
