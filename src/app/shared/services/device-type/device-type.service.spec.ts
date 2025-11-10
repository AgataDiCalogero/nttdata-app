// src/app/shared/services/device-type.service.spec.ts
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { DeviceTypeService } from './device-type.service';

const MOBILE_BREAKPOINT = '(max-width: 768px)';
const TABLET_BREAKPOINT = '(min-width: 769px) and (max-width: 1024px)';
const DESKTOP_BREAKPOINT = '(min-width: 1025px)';

describe('DeviceTypeService', () => {
  let service: DeviceTypeService;
  let breakpointObserverSpy: jasmine.SpyObj<BreakpointObserver>;
  let observeSubject: Subject<BreakpointState>;

  beforeEach(() => {
    observeSubject = new Subject<BreakpointState>();
    breakpointObserverSpy = jasmine.createSpyObj('BreakpointObserver', ['observe']);
    breakpointObserverSpy.observe.and.returnValue(observeSubject.asObservable());

    TestBed.configureTestingModule({
      providers: [
        DeviceTypeService,
        { provide: BreakpointObserver, useValue: breakpointObserverSpy },
      ],
    });

    service = TestBed.inject(DeviceTypeService);
  });

  function emitBreakpoints(breakpoints: Record<string, boolean>): void {
    observeSubject.next({
      matches: Object.values(breakpoints).some(Boolean),
      breakpoints,
    });
  }

  it('should expose desktop flags by default', () => {
    // Arrange - service instantiated in beforeEach
    // Act
    const type = service.deviceType();

    // Assert
    expect(type).toBe('desktop');
    expect(service.isDesktop()).toBeTrue();
  });

  it('should switch to mobile when mobile breakpoint matches', () => {
    // Arrange
    emitBreakpoints({ [MOBILE_BREAKPOINT]: true });

    // Act
    const type = service.deviceType();

    // Assert
    expect(type).toBe('mobile');
    expect(service.isMobile()).toBeTrue();
  });

  it('should switch to tablet when tablet breakpoint matches', () => {
    // Arrange
    emitBreakpoints({ [TABLET_BREAKPOINT]: true });

    // Act
    const isTablet = service.isTablet();

    // Assert
    expect(isTablet).toBeTrue();
    expect(service.deviceType()).toBe('tablet');
  });

  it('should reset to desktop when only desktop breakpoint matches', () => {
    // Arrange
    emitBreakpoints({ [DESKTOP_BREAKPOINT]: true });

    // Act
    const isDesktop = service.isDesktop();

    // Assert
    expect(isDesktop).toBeTrue();
    expect(service.deviceType()).toBe('desktop');
  });
});
