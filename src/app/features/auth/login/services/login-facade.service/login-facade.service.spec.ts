import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { TokenValidationService } from '@/app/core/auth/auth-token-validation/token-validation.service';

import { LoginFacadeService } from './login-facade.service';

describe('LoginFacadeService', () => {
  let service: LoginFacadeService;
  let mockValidator: jasmine.SpyObj<TokenValidationService>;
  let mockAuth: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockValidator = jasmine.createSpyObj('TokenValidationService', ['validate']);
    mockAuth = jasmine.createSpyObj('AuthService', ['setToken']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        LoginFacadeService,
        { provide: TokenValidationService, useValue: mockValidator },
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(LoginFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should successfully login with valid token', (done) => {
    const token = 'valid-token-123';
    mockValidator.validate.and.returnValue(of({ success: true }));

    service.login(token).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(mockAuth.setToken).toHaveBeenCalledWith(token);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
      done();
    });
  });

  it('should return error for unauthorized token', (done) => {
    const token = 'invalid-token';
    mockValidator.validate.and.returnValue(
      of({ success: false, code: 'unauthorized', message: 'Invalid token' }),
    );

    service.login(token).subscribe((result) => {
      expect(result.success).toBe(false);
      expect(result.code).toBe('unauthorized');
      expect(result.message).toBe('Invalid token');
      expect(mockAuth.setToken).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return error for empty token', (done) => {
    const token = '';
    mockValidator.validate.and.returnValue(
      of({ success: false, code: 'empty', message: 'Token is required' }),
    );

    service.login(token).subscribe((result) => {
      expect(result.success).toBe(false);
      expect(result.code).toBe('empty');
      expect(mockAuth.setToken).not.toHaveBeenCalled();
      done();
    });
  });

  it('should handle network errors gracefully', (done) => {
    const token = 'test-token';
    mockValidator.validate.and.returnValue(throwError(() => new Error('Network error')));

    service.login(token).subscribe((result) => {
      expect(result.success).toBe(false);
      expect(result.code).toBe('network');
      expect(mockAuth.setToken).not.toHaveBeenCalled();
      done();
    });
  });

  it('should trim token before validation', (done) => {
    const token = '  token-with-spaces  ';
    const trimmed = 'token-with-spaces';
    mockValidator.validate.and.returnValue(of({ success: true }));

    service.login(token).subscribe(() => {
      expect(mockValidator.validate).toHaveBeenCalledWith(trimmed);
      expect(mockAuth.setToken).toHaveBeenCalledWith(trimmed);
      done();
    });
  });
});
