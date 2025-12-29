import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { LUCIDE_ICONS } from 'lucide-angular';
import { of } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';

import { UserFiltersComponent } from './user-filters.component';

type WithControls = UserFiltersComponent & {
  perPageControl: FormControl<string>;
  searchControl: FormControl<string>;
};

describe('UserFiltersComponent', () => {
  let component: UserFiltersComponent;
  let fixture: ComponentFixture<UserFiltersComponent>;
  let i18nSpy: jasmine.SpyObj<I18nService>;

  beforeEach(async () => {
    i18nSpy = jasmine.createSpyObj('I18nService', ['translate']);
    i18nSpy.translate.and.callFake((_k: string, params?: Record<string, unknown>) => {
      const val = params?.['value'];
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
      }
      return '';
    });

    await TestBed.configureTestingModule({
      imports: [UserFiltersComponent],
      providers: [
        { provide: I18nService, useValue: i18nSpy },
        {
          provide: MatIconRegistry,
          useValue: { addSvgIconLiteral: () => {}, getNamedSvgIcon: () => of(null) },
        },
        { provide: LUCIDE_ICONS, useValue: [] },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('perPageOptions', [5, 10, 20]);
    fixture.componentRef.setInput('perPage', 10);
    fixture.detectChanges();
  });

  it('emette searchChange al debounce handler', () => {
    const spy = jasmine.createSpy('search');
    component.searchChange.subscribe(spy);

    component.onDebounced('alice');
    expect(spy).toHaveBeenCalledWith('alice');
  });

  it('sincronizza il FormControl quando cambia l’input perPage', () => {
    fixture.componentRef.setInput('perPage', 20);
    fixture.detectChanges();

    expect((component as WithControls).perPageControl.value).toBe('20');
  });

  it('sincronizza il FormControl quando cambia l’input searchTerm', () => {
    fixture.componentRef.setInput('searchTerm', 'bob');
    fixture.detectChanges();

    expect((component as WithControls).searchControl.value).toBe('bob');
  });

  it('emette perPageChange convertendo la stringa in numero', () => {
    const spy = jasmine.createSpy('perPage');
    component.perPageChange.subscribe(spy);

    component.onPerPageSelected('5');
    expect(spy).toHaveBeenCalledWith(5);
  });

  it('emette create quando richiesto', () => {
    const spy = jasmine.createSpy('create');
    component.create.subscribe(spy);

    component.onCreate();
    expect(spy).toHaveBeenCalled();
  });

  it('emette resetFilters quando il pulsante viene cliccato', () => {
    const spy = jasmine.createSpy('reset');
    component.resetFilters.subscribe(spy);

    component.onReset();
    expect(spy).toHaveBeenCalled();
  });
});
