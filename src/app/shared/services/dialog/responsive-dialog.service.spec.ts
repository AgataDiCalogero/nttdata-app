import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';

import { ResponsiveDialogService } from './responsive-dialog.service';

describe('ResponsiveDialogService', () => {
  let service: ResponsiveDialogService;
  let breakpointObserver: jasmine.SpyObj<BreakpointObserver>;

  beforeEach(() => {
    breakpointObserver = jasmine.createSpyObj('BreakpointObserver', ['isMatched']);

    TestBed.configureTestingModule({
      providers: [
        ResponsiveDialogService,
        { provide: BreakpointObserver, useValue: breakpointObserver },
      ],
    });

    service = TestBed.inject(ResponsiveDialogService);
  });

  it('should return desktop configuration when breakpoint is not mobile', () => {
    breakpointObserver.isMatched.and.returnValue(false);
    const config = service.form({ ariaLabel: 'Create post' });
    expect(config.width).toBe('37.5rem');
    expect(config.panelClass).toEqual(['app-dialog-panel', 'app-dialog--md', 'app-dialog-size-md']);
  });

  it('should return mobile configuration when breakpoint matches mobile query', () => {
    breakpointObserver.isMatched.and.returnValue(true);
    const config = service.form({ ariaLabel: 'Create post' });
    expect(config.width).toBe('100vw');
    expect(config.maxWidth).toBe('100vw');
    expect(config.maxHeight).toBeUndefined();
    expect(config.panelClass).toEqual([
      'app-dialog-panel',
      'app-dialog--sheet',
      'app-dialog-size-sheet',
    ]);
  });

  it('should merge shared and desktop overrides keeping panel classes unique', () => {
    breakpointObserver.isMatched.and.returnValue(false);
    const options = {
      ariaLabel: 'Update user',
      shared: { panelClass: 'shared-class' },
      desktop: { panelClass: 'desktop-class', width: '50rem' },
    } as const;
    const config = service.form(options);
    expect(config.width).toBe('50rem');
    expect(config.panelClass).toEqual([
      'shared-class',
      'app-dialog-panel',
      'app-dialog--md',
      'app-dialog-size-md',
      'desktop-class',
    ]);
  });

  it('should copy provided data into the emitted configuration', () => {
    breakpointObserver.isMatched.and.returnValue(true);
    const data = { id: 42 };
    const config = service.form({ ariaLabel: 'Edit', data });
    expect(config.data).toBe(data);
  });
});
