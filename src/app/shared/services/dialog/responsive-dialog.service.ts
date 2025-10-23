import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';

const MOBILE_QUERY = '(max-width: 639.98px)';

type ResponsiveDialogConfig<TData, R, C> = DialogConfig<TData, DialogRef<R, C>>;

export interface ResponsiveDialogOptions<TData = unknown, R = unknown, C = unknown> {
  ariaLabel: string;
  data?: TData;
  shared?: Partial<ResponsiveDialogConfig<TData, R, C>>;
  desktop?: Partial<ResponsiveDialogConfig<TData, R, C>>;
  mobile?: Partial<ResponsiveDialogConfig<TData, R, C>>;
}

@Injectable({ providedIn: 'root' })
export class ResponsiveDialogService {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly overlay = inject(Overlay);

  form<TData, R = unknown, C = unknown>(
    options: ResponsiveDialogOptions<TData, R, C>,
  ): ResponsiveDialogConfig<TData, R, C> {
    const sharedDefaults: ResponsiveDialogConfig<TData, R, C> = {
      ariaLabel: options.ariaLabel,
      backdropClass: 'app-dialog-overlay',
      autoFocus: true,
      restoreFocus: true,
      closeOnNavigation: true,
      disableClose: false,
    };

    const sharedConfig = this.mergeConfig(sharedDefaults, options.shared);
    const desktopBase: ResponsiveDialogConfig<TData, R, C> = {
      ...sharedConfig,
      width: '37.5rem',
      maxWidth: '90vw',
      panelClass: this.combinePanelClasses(sharedConfig.panelClass, 'app-dialog-panel'),
    };
    const desktopConfig = this.mergeConfig(desktopBase, options.desktop);

    const mobileBase: ResponsiveDialogConfig<TData, R, C> = {
      ...sharedConfig,
      height: '100%',
      width: '30rem',
      maxWidth: '100vw',
      panelClass: this.combinePanelClasses(sharedConfig.panelClass, 'app-dialog-panel'),
      positionStrategy: this.overlay.position().global().top('0').right('0'),
    };
    const mobileConfig = this.mergeConfig(mobileBase, options.mobile);

    if (options.data !== undefined) {
      desktopConfig.data = options.data;
      mobileConfig.data = options.data;
    }

    return this.breakpointObserver.isMatched(MOBILE_QUERY) ? mobileConfig : desktopConfig;
  }

  private mergeConfig<TData, R, C>(
    base: ResponsiveDialogConfig<TData, R, C>,
    override?: Partial<ResponsiveDialogConfig<TData, R, C>>,
  ): ResponsiveDialogConfig<TData, R, C> {
    if (!override) {
      return { ...base };
    }

    const merged: ResponsiveDialogConfig<TData, R, C> = { ...base, ...override };
    merged.panelClass = this.combinePanelClasses(base.panelClass, override?.panelClass);
    return merged;
  }

  private combinePanelClasses(
    ...classes: Array<string | string[] | undefined>
  ): string | string[] | undefined {
    const flattened = classes
      .flatMap((value) => {
        if (Array.isArray(value)) {
          return value;
        }
        return value ? [value] : [];
      })
      .filter((value, index, all) => all.indexOf(value) === index);

    if (!flattened.length) {
      return undefined;
    }

    return flattened.length === 1 ? flattened[0] : flattened;
  }
}
