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
    const type = service.deviceType();
    expect(type).toBe('desktop');
    expect(service.isDesktop()).toBeTrue();
  });

  it('should switch to mobile when mobile breakpoint matches', () => {
    emitBreakpoints({ [MOBILE_BREAKPOINT]: true });
    const type = service.deviceType();
    expect(type).toBe('mobile');
    expect(service.isMobile()).toBeTrue();
  });

  it('should switch to tablet when tablet breakpoint matches', () => {
    emitBreakpoints({ [TABLET_BREAKPOINT]: true });
    const type = service.deviceType();
    expect(type).toBe('tablet');
    expect(service.isTablet()).toBeTrue();
  });

  it('should reset to desktop when only desktop breakpoint matches', () => {
    emitBreakpoints({ [DESKTOP_BREAKPOINT]: true });
    const type = service.deviceType();
    expect(type).toBe('desktop');
    expect(service.isDesktop()).toBeTrue();
  });
});
