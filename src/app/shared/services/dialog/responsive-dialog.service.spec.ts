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
    // Arrange
    breakpointObserver.isMatched.and.returnValue(false);

    // Act
    const config = service.form({ ariaLabel: 'Create post' });

    // Assert
    expect(config.width).toBe('37.5rem');
    expect(config.panelClass).toBe('app-dialog-panel');
  });

  it('should return mobile configuration when breakpoint matches mobile query', () => {
    // Arrange
    breakpointObserver.isMatched.and.returnValue(true);

    // Act
    const config = service.form({ ariaLabel: 'Create post' });

    // Assert
    expect(config.width).toBe('100vw');
    expect(config.maxHeight).toContain('100vh');
  });

  it('should merge shared and desktop overrides keeping panel classes unique', () => {
    // Arrange
    breakpointObserver.isMatched.and.returnValue(false);
    const options = {
      ariaLabel: 'Update user',
      shared: { panelClass: 'shared-class' },
      desktop: { panelClass: 'desktop-class', width: '50rem' },
    } as const;

    // Act
    const config = service.form(options);

    // Assert
    expect(config.width).toBe('50rem');
    expect(config.panelClass).toEqual(['shared-class', 'app-dialog-panel', 'desktop-class']);
  });

  it('should copy provided data into the emitted configuration', () => {
    // Arrange
    breakpointObserver.isMatched.and.returnValue(true);
    const data = { id: 42 };

    // Act
    const config = service.form({ ariaLabel: 'Edit', data });

    // Assert
    expect(config.data).toBe(data);
  });
});
