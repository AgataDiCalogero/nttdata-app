import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { LucideAngularModule, Sun, Moon, BookOpenCheck } from 'lucide-angular';
import { ThemeService } from '@app/core/theme/theme.service';
import { ClickOutsideDirective } from '@app/shared/directives/click-outside.directive';
import { EscapeKeyDirective } from '@app/shared/directives/escape-key.directive';

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
