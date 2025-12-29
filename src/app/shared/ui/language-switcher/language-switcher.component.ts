import { UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ClickOutsideDirective } from '@app/shared/directives/click-outside.directive';
import { EscapeKeyDirective } from '@app/shared/directives/escape-key.directive';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { I18nService, type Locale } from '../../i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    ButtonComponent,
    UpperCasePipe,
    ClickOutsideDirective,
    EscapeKeyDirective,
    TranslatePipe,
  ],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly i18n = inject(I18nService);
  private readonly overlays = inject(UiOverlayService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayKey = 'language-menu';

  readonly locale = this.i18n.locale;
  readonly locales = this.i18n.availableLocales;
  readonly label = computed(
    () => `${this.i18n.translate('language.label')}: ${this.locale().toUpperCase()}`,
  );
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
    this.overlays.activate({ key: this.overlayKey, close: () => this.closeMenu() });
    this.menuState.set(true);
  }

  closeMenu(): void {
    if (!this.menuState()) {
      return;
    }
    this.menuState.set(false);
    this.overlays.release(this.overlayKey);
  }

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
    this.closeMenu();
  }

  onDocumentClick(): void {
    if (this.menuState()) {
      this.closeMenu();
    }
  }

  onEscape(): void {
    this.closeMenu();
  }
}
