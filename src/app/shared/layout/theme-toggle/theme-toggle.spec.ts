import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeToggle } from './theme-toggle';
import { ThemeService } from '../../../core/theme/theme.service';

describe('ThemeToggle', () => {
  let component: ThemeToggle;
  let fixture: ComponentFixture<ThemeToggle>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggle);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle theme through the service', () => {
    const initialTheme = themeService.theme();

    component.toggleTheme();

    expect(themeService.theme()).not.toBe(initialTheme);
  });
});
