import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

@Injectable({
  providedIn: 'root',
})
export class DeviceTypeService {
  deviceType = signal<DeviceType>('desktop');
  isMobile = signal<boolean>(false);
  isTablet = signal<boolean>(false);
  isDesktop = signal<boolean>(true);

  private readonly MOBILE_BREAKPOINT = '(max-width: 768px)';
  private readonly TABLET_BREAKPOINT = '(min-width: 769px) and (max-width: 1024px)';
  private readonly DESKTOP_BREAKPOINT = '(min-width: 1025px)';

  constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly destroyRef: DestroyRef,
  ) {
    this.breakpointObserver
      .observe([this.MOBILE_BREAKPOINT, this.TABLET_BREAKPOINT, this.DESKTOP_BREAKPOINT])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result.breakpoints[this.MOBILE_BREAKPOINT]) {
          this.deviceType.set('mobile');
          this.isMobile.set(true);
          this.isTablet.set(false);
          this.isDesktop.set(false);
        } else if (result.breakpoints[this.TABLET_BREAKPOINT]) {
          this.deviceType.set('tablet');
          this.isMobile.set(false);
          this.isTablet.set(true);
          this.isDesktop.set(false);
        } else {
          this.deviceType.set('desktop');
          this.isMobile.set(false);
          this.isTablet.set(false);
          this.isDesktop.set(true);
        }
      });
  }
}
