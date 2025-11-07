import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { I18nService, type Locale } from './i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [ButtonComponent, UpperCasePipe],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly i18n = inject(I18nService);
  readonly locale = this.i18n.locale;
  readonly locales = this.i18n.availableLocales;
  readonly label = computed(() => `Current language: ${this.locale()}`);

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }
}
