import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
} from '@/app/shared/config/pagination.config';
import type { User } from '@/app/shared/models/user';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';

import { usersServiceInjectionToken } from './users.inject';
import { UsersStoreAdapter } from './users.store';

describe('UsersStoreAdapter', () => {
  let usersApi: jasmine.SpyObj<UsersApiService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRoute;
  let auth: { token: () => string | null };

  beforeEach(() => {
    usersApi = jasmine.createSpyObj('UsersApiService', ['list', 'update']);
    usersApi.list.and.returnValue(
      of({
        items: [{ id: 1, name: 'Alice', email: 'a@example.com', status: 'active' } as User],
        pagination: { total: 1, pages: 1, page: 1, limit: 10 },
      }),
    );
    usersApi.update.and.returnValue(
      of({ id: 1, name: 'Alice', email: 'a@example.com', status: 'inactive' } as User),
    );

    router = jasmine.createSpyObj('Router', ['navigate']);
    route = {
      snapshot: { queryParamMap: convertToParamMap({}) },
    } as unknown as ActivatedRoute;
    auth = { token: () => 'token-123' };

    TestBed.configureTestingModule({
      providers: [
        DestroyRef,
        { provide: UsersApiService, useValue: usersApi },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: AuthService, useValue: auth },
        { provide: PAGINATION_CONFIG, useValue: DEFAULT_PAGINATION_CONFIG },
        { provide: usersServiceInjectionToken, useClass: UsersStoreAdapter },
      ],
    });
  });

  it('carica gli utenti all’avvio e usa i parametri di paginazione', () => {
    const store = TestBed.inject(usersServiceInjectionToken);

    expect(usersApi.list).toHaveBeenCalledWith({ page: 1, perPage: 10 });
    expect(store.users().length).toBe(1);
    expect(store.pagination()?.total).toBe(1);
  });

  it('onSearch imposta name/email e ricarica la lista', () => {
    const store = TestBed.inject(usersServiceInjectionToken);
    usersApi.list.calls.reset();
    store.onSearch('bob@example.com');

    expect(usersApi.list).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 1,
        perPage: 10,
        name: 'bob@example.com',
        email: 'bob@example.com',
      }),
    );
  });

  it('setPage e setPerPage rispettano limiti e richiamano list', () => {
    const store = TestBed.inject(usersServiceInjectionToken);
    usersApi.list.calls.reset();

    store.setPage(3);
    expect(usersApi.list).toHaveBeenCalledWith(jasmine.objectContaining({ page: 3 }));

    usersApi.list.calls.reset();
    store.setPerPage(25);
    expect(usersApi.list.calls.count()).toBeGreaterThan(0);
  });

  it('toggleSort inverte la direzione quando il campo è lo stesso', () => {
    const store = TestBed.inject(usersServiceInjectionToken);
    const initialDir = store.sortState().dir;

    store.toggleSort('name');
    expect(store.sortState().dir).toBe(initialDir === 1 ? -1 : 1);

    store.toggleSort('email');
    expect(store.sortState().field).toBe('email');
  });

  it('updateStatus applica update ottimistico e ripristina in caso di errore', () => {
    spyOn(console, 'error').and.stub();
    const store = TestBed.inject(usersServiceInjectionToken);
    store.updateStatus(1, 'inactive');
    expect(usersApi.update).toHaveBeenCalledWith(1, { status: 'inactive' });
    expect(store.users()[0].status).toBe('inactive');

    usersApi.update.and.returnValue(throwError(() => new Error('fail')));
    store.updateStatus(1, 'active');
    expect(store.users()[0].status).toBe('inactive');
  });
});
