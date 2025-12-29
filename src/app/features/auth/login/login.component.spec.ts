import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { LUCIDE_ICONS } from 'lucide-angular';
import { of } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  TokenValidationService,
  type TokenValidationResult,
} from '@/app/core/auth/auth-token-validation/token-validation.service';

import { Login } from './login.component';

describe('Login component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let validator: jasmine.SpyObj<TokenValidationService>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    validator = jasmine.createSpyObj('TokenValidationService', ['validate']);
    auth = jasmine.createSpyObj('AuthService', ['setToken']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    toast = jasmine.createSpyObj('ToastService', ['show']);

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideNoopAnimations(),
        { provide: TokenValidationService, useValue: validator },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        { provide: UiOverlayService, useValue: {} },
        {
          provide: I18nService,
          useValue: {
            translate: (_k: string, params?: Record<string, unknown>) => params?.count ?? _k,
          },
        },
        {
          provide: MatIconRegistry,
          useValue: { addSvgIconLiteral: () => {}, getNamedSvgIcon: () => of(null) },
        },
        { provide: LUCIDE_ICONS, useValue: [] },
      ],
    });

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('valida il form (required/minlength) mostrando errori', () => {
    component.form.controls.token.setValue('');
    component.onSubmit();

    expect(component.form.invalid).toBeTrue();
    expect(component.tokenErrorMessage()).toContain('login.errors.required');

    component.form.controls.token.setValue('short');
    component.form.markAllAsTouched();
    component['attemptedSubmit'].set(true);
    fixture.detectChanges();
    expect(component.form.controls.token.hasError('minlength')).toBeTrue();
  });

  it('submit successo salva token, resetta form e naviga a /users', () => {
    validator.validate.and.returnValue(of({ success: true }));
    component.form.controls.token.setValue('  VALID  ');

    component.onSubmit();

    expect(auth.setToken).toHaveBeenCalledWith('VALID');
    expect(component.form.controls.token.value).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('gestisce 401/empty impostando errore api e toast', () => {
    validator.validate.and.returnValue(
      of({ success: false, code: 'unauthorized', message: 'bad token' }),
    );
    component.form.controls.token.setValue('bad-token');

    component.onSubmit();

    expect(component.form.controls.token.hasError('api')).toBeTrue();
    expect(toast.show).toHaveBeenCalledWith('error', 'bad token', 5000);
  });

  it('mostra submissionMessage per rate-limit', () => {
    validator.validate.and.returnValue(
      of({ success: false, code: 'rate_limited', message: 'slow down' }),
    );
    component.form.controls.token.setValue('rate-limit-token');

    component.onSubmit();

    expect(component.submissionMessage()).toBe('slow down');
    expect(toast.show).toHaveBeenCalledWith('error', 'slow down', 5000);
  });

  it('azzera messaggi e errori api dopo submit riuscito', () => {
    component.submissionMessage.set('previous');
    component.form.controls.token.setValue('valid-token');
    validator.validate.and.returnValue(of({ success: true }));

    component.onSubmit();

    expect(component.submissionMessage()).toBeNull();
    expect(component.form.controls.token.hasError('api')).toBeFalse();
  });

  it('gestisce errori generici mostrando il fallback', () => {
    validator.validate.and.returnValue(
      of({ success: false, code: 'unknown', message: undefined } as TokenValidationResult),
    );
    component.form.controls.token.setValue('token-xyz');

    component.onSubmit();

    expect(component.submissionMessage()).toBe('login.errors.unableToVerify');
    expect(toast.show).toHaveBeenCalledWith('error', 'login.errors.unableToVerify', 5000);
  });

  it('disabilita input quando loading è true', fakeAsync(() => {
    component.loading.set(true);
    fixture.detectChanges();
    tick();

    expect(component.tokenControl.disabled).toBeTrue();

    component.loading.set(false);
    fixture.detectChanges();
    tick();

    expect(component.tokenControl.enabled).toBeTrue();
  }));
});
