import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { LucideAngularModule, Sun, Moon, BookOpenCheck } from 'lucide-angular';
import { ClickOutsideDirective } from '@app/shared/directives/click-outside.directive';
import { EscapeKeyDirective } from '@app/shared/directives/escape-key.directive';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-appearance-switcher',
  standalone: true,
  imports: [LucideAngularModule, ClickOutsideDirective, EscapeKeyDirective],
  templateUrl: './appearance-switcher.component.html',
  styleUrls: ['./appearance-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSwitcherComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly themeService = inject(ThemeService);

  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly BookOpenCheck = BookOpenCheck;

  readonly theme = this.themeService.theme;
  readonly isLight = this.themeService.isLightTheme;
  readonly isReadingMode = this.themeService.isReadingMode;

  // Computed signal for the current icon based on theme and reading mode
  readonly currentIcon = computed(() => {
    if (this.isReadingMode()) {
      return this.BookOpenCheck;
    }
    return this.isLight() ? this.Sun : this.Moon;
  });

  private readonly menuState = signal(false);
  readonly menuOpen = this.menuState.asReadonly();

  toggleMenu(): void {
    this.menuState.update((open) => !open);
  }

  closeMenu(): void {
    this.menuState.set(false);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
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
