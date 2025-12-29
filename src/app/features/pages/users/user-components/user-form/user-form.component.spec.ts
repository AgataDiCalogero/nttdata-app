import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';

import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { User } from '@/app/shared/models/user';

import { UserForm } from './user-form.component';

describe('UserFormComponent', () => {
  let component: UserForm;
  let fixture: ComponentFixture<UserForm>;

  let usersApiSpy: jasmine.SpyObj<UsersApiService>;
  let dialogRefSpy: jasmine.SpyObj<DialogRef>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const mockUser: User = {
    id: 123,
    name: 'Test User',
    email: 'test@example.com',
    gender: 'male',
    status: 'active',
  };

  beforeEach(async () => {
    usersApiSpy = jasmine.createSpyObj('UsersApiService', ['create', 'update']);
    dialogRefSpy = jasmine.createSpyObj('DialogRef', ['close']);
    toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    usersApiSpy.create.and.returnValue(of(mockUser));
    usersApiSpy.update.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [
        provideNoopAnimations(),
        { provide: UsersApiService, useValue: usersApiSpy },
        { provide: DialogRef, useValue: dialogRefSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: DIALOG_DATA, useValue: {} },
        {
          provide: I18nService,
          useValue: {
            translate: (key: string) => {
              switch (key) {
                case 'userForm.errors.emailInUse':
                  return 'Email already in use';
                case 'userForm.submitErrors.rateLimit':
                  return 'Too many requests';
                case 'userForm.submitErrors.saveFailed':
                  return 'An error occurred while saving';
                default:
                  return key;
              }
            },
          } satisfies Pick<I18nService, 'translate'>,
        },
      ],
    }).compileComponents();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(UserForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize with empty form', () => {
      expect(component.isEdit()).toBeFalse();
      expect(component.form.value).toEqual({
        name: '',
        email: '',
        gender: 'male',
        status: 'active',
      });
    });

    it('should validate required fields', () => {
      component.form.setValue({
        name: '',
        email: '',
        gender: 'male',
        status: 'active',
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.controls.name.hasError('required')).toBeTrue();
      expect(component.form.controls.email.hasError('required')).toBeTrue();
    });

    it('should validate email format', () => {
      component.form.controls.email.setValue('invalid-email');
      expect(component.form.controls.email.hasError('email')).toBeTrue();
    });

    it('should submit valid form and close dialog', () => {
      component.form.setValue({
        name: 'New User',
        email: 'new@example.com',
        gender: 'male',
        status: 'active',
      });

      component.submit();

      expect(usersApiSpy.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'New User',
          email: 'new@example.com',
        }),
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith('success');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      TestBed.overrideProvider(DIALOG_DATA, { useValue: { user: mockUser } });
      fixture = TestBed.createComponent(UserForm);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize with user data', () => {
      expect(component.isEdit()).toBeTrue();
      expect(component.userId()).toBe(123);
      expect(component.form.getRawValue()).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        gender: 'male',
        status: 'active',
      });
    });

    it('should call update on submit', () => {
      component.form.controls.name.setValue('Updated Name');
      component.submit();

      expect(usersApiSpy.update).toHaveBeenCalledWith(
        123,
        jasmine.objectContaining({
          name: 'Updated Name',
        }),
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith('success');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(UserForm);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.form.setValue({
        name: 'Test',
        email: 'test@test.com',
        gender: 'male',
        status: 'active',
      });
    });

    it('should handle 422 error (email duplicate)', () => {
      usersApiSpy.create.and.returnValue(throwError(() => ({ status: 422 })));

      component.submit();

      expect(component.emailError()).toContain('Email already in use');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should handle 429 error (rate limit)', () => {
      usersApiSpy.create.and.returnValue(throwError(() => ({ status: 429 })));

      component.submit();

      expect(toastSpy.show).toHaveBeenCalledWith(
        'error',
        jasmine.stringMatching(/Too many requests/),
      );
    });

    it('should handle generic error', () => {
      usersApiSpy.create.and.returnValue(throwError(() => ({ status: 500 })));

      component.submit();

      expect(toastSpy.show).toHaveBeenCalledWith(
        'error',
        jasmine.stringMatching(/An error occurred/),
      );
    });
  });
});
