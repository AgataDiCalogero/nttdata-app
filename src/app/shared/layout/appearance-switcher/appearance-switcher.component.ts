import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { LucideAngularModule, Palette, Sun, Moon, BookOpenCheck } from 'lucide-angular';
import { ThemeService } from '@app/core/theme/theme.service';

@Component({
  selector: 'app-appearance-switcher',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './appearance-switcher.component.html',
  styleUrls: ['./appearance-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSwitcherComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly themeService = inject(ThemeService);

  readonly Palette = Palette;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly BookOpenCheck = BookOpenCheck;

  readonly theme = this.themeService.theme;
  readonly isLight = this.themeService.isLightTheme;
  readonly isReadingMode = this.themeService.isReadingMode;

  private readonly menuState = signal(false);
  readonly menuOpen = this.menuState.asReadonly();
  readonly activeThemeLabel = computed(() => (this.isLight() ? 'Tema chiaro' : 'Tema scuro'));

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.menuState()) {
      return;
    }
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
