import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DialogConfig } from '@angular/cdk/dialog';

const MOBILE_QUERY = '(max-width: 639.98px)';

export interface ResponsiveDialogOptions<TData = unknown> {
  ariaLabel: string;
  data?: TData;
  /**
   * Override shared defaults (applied to both desktop and mobile variants).
   */
  shared?: Partial<DialogConfig<TData>>;
  /**
   * Desktop-specific overrides merged on top of the shared defaults.
   */
  desktop?: Partial<DialogConfig<TData>>;
  /**
   * Mobile-specific overrides merged on top of the shared defaults.
   */
  mobile?: Partial<DialogConfig<TData>>;
}

@Injectable({ providedIn: 'root' })
export class ResponsiveDialogService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  /**
   * Builds a dialog configuration that adapts between desktop modal and mobile drawer layouts.
   */
  form<TData>(options: ResponsiveDialogOptions<TData>): DialogConfig<TData> {
    const sharedDefaults: DialogConfig<TData> = {
      ariaLabel: options.ariaLabel,
      backdropClass: 'blurred-backdrop',
      autoFocus: true,
      restoreFocus: true,
      closeOnNavigation: true,
      disableClose: false,
      ...(options.shared ?? {}),
    };

    const desktopConfig: DialogConfig<TData> = {
      ...sharedDefaults,
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'user-form-modal',
      ...(options.desktop ?? {}),
    };

    const mobileConfig: DialogConfig<TData> = {
      ...sharedDefaults,
      position: { right: '0', top: '0' },
      height: '100%',
      width: '480px',
      maxWidth: '100vw',
      panelClass: 'slide-in-drawer',
      ...(options.mobile ?? {}),
    };

    if (options.data !== undefined) {
      desktopConfig.data = options.data;
      mobileConfig.data = options.data;
    }

    return this.breakpointObserver.isMatched(MOBILE_QUERY) ? mobileConfig : desktopConfig;
  }
}
