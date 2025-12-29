import { DestroyRef, PLATFORM_ID, signal } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { delay, of, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
} from '@/app/shared/config/pagination.config';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import type { User } from '@/app/shared/models/user';

import { usersServiceInjectionToken } from './users.inject';
import { UsersStoreAdapter } from './users.store';

describe('UsersStoreAdapter', () => {
  let usersApi: jasmine.SpyObj<UsersApiService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRoute;
  let auth: { token: ReturnType<typeof signal<string | null>> };

  beforeEach(() => {
    usersApi = jasmine.createSpyObj('UsersApiService', ['list', 'update']);
    usersApi.list.and.callFake(
      (params: { page?: number; perPage?: number; name?: string; email?: string } = {}) =>
        of({
          items: [{ id: 1, name: 'Alice', email: 'a@example.com', status: 'active' } as User],
          pagination: {
            total: 1,
            pages: 1,
            page: params.page ?? 1,
            limit: params.perPage ?? 10,
          },
        }),
    );
    usersApi.update.and.returnValue(
      of({ id: 1, name: 'Alice', email: 'a@example.com', status: 'inactive' } as User),
    );

    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));
    route = {
      snapshot: { queryParamMap: convertToParamMap({}) },
    } as unknown as ActivatedRoute;
    auth = { token: signal('token-123') };

    TestBed.configureTestingModule({
      providers: [
        DestroyRef,
        { provide: UsersApiService, useValue: usersApi },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: AuthService, useValue: auth },
        { provide: PAGINATION_CONFIG, useValue: DEFAULT_PAGINATION_CONFIG },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: usersServiceInjectionToken, useClass: UsersStoreAdapter },
      ],
    });
  });

  it('carica gli utenti all’avvio e usa i parametri di paginazione', fakeAsync(() => {
    const store = TestBed.inject(usersServiceInjectionToken);
    tick();

    expect(usersApi.list).toHaveBeenCalledWith({ page: 1, perPage: 10 }, { cache: true });
    expect(store.users().length).toBe(1);
    expect(store.pagination()?.total).toBe(1);
  }));

  it('onSearch imposta name/email e ricarica la lista', fakeAsync(() => {
    const store = TestBed.inject(usersServiceInjectionToken);
    tick();
    usersApi.list.calls.reset();
    store.onSearch('bob@example.com');
    tick();

    expect(usersApi.list).toHaveBeenCalledWith(
      jasmine.objectContaining({
        page: 1,
        perPage: 10,
        name: 'bob@example.com',
        email: 'bob@example.com',
      }),
      { cache: true },
    );
  }));

  it('setPerPage normalizza il valore e sincronizza i query params', fakeAsync(() => {
    const store = TestBed.inject(usersServiceInjectionToken);
    tick();
    usersApi.list.calls.reset();
    router.navigate.calls.reset();

    store.setPerPage(25);
    tick();
    expect(store.perPage()).toBe(50);
    expect(usersApi.list).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1, perPage: 50 }), {
      cache: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ page: 1, per_page: 50 }),
      }),
    );
  }));

  it('loadUsers con forceReload ignora la cache e ricarica con gli stessi criteri', fakeAsync(() => {
    const store = TestBed.inject(usersServiceInjectionToken);
    tick();
    usersApi.list.calls.reset();

    store.loadUsers({ forceReload: true, pushUrl: false });
    tick();

    expect(usersApi.list).toHaveBeenCalled();
  }));

  it('toggleSort inverte la direzione quando il campo è lo stesso', () => {
    const store = TestBed.inject(usersServiceInjectionToken);
    const initialDir = store.sortState().dir;

    store.toggleSort('name');
    expect(store.sortState().dir).toBe(initialDir === 1 ? -1 : 1);

    store.toggleSort('email');
    expect(store.sortState().field).toBe('email');
  });

  it('updateStatus applica update ottimistico e ripristina in caso di errore', fakeAsync(() => {
    spyOn(console, 'error').and.stub();
    const store = TestBed.inject(usersServiceInjectionToken);
    tick();
    store.updateStatus(1, 'inactive');
    expect(usersApi.update).toHaveBeenCalledWith(1, { status: 'inactive' });
    expect(store.users()[0].status).toBe('inactive');

    usersApi.update.and.returnValue(throwError(() => new Error('fail')));
    store.updateStatus(1, 'active');
    expect(store.users()[0].status).toBe('inactive');
  }));

  it('doppia ricerca rapida: applica solo l’ultima risposta', fakeAsync(() => {
    const store = TestBed.inject(usersServiceInjectionToken);
    tick();
    usersApi.list.calls.reset();
    router.navigate.calls.reset();

    usersApi.list.and.returnValues(
      of({
        items: [{ id: 1, name: 'Slow', email: 's@example.com', status: 'active' } as User],
        pagination: { total: 1, pages: 1, page: 1, limit: 10 },
      }).pipe(delay(200)),
      of({
        items: [{ id: 2, name: 'Fast', email: 'f@example.com', status: 'active' } as User],
        pagination: { total: 1, pages: 1, page: 1, limit: 10 },
      }).pipe(delay(10)),
    );

    store.onSearch('slow');
    tick(0);
    store.onSearch('fast');

    tick(20);
    expect(store.users().map((u) => u.id)).toEqual([2]);

    tick(300);
    expect(store.users().map((u) => u.id)).toEqual([2]);
  }));

  it('normalizza perPage da query params invalidi', fakeAsync(() => {
    (route.snapshot as { queryParamMap: unknown }).queryParamMap = convertToParamMap({
      page: '1',
      per_page: '25',
    });

    const store = TestBed.inject(usersServiceInjectionToken);
    tick();
    expect(usersApi.list).toHaveBeenCalledWith(jasmine.objectContaining({ perPage: 50 }), {
      cache: true,
    });
    expect(store.perPage()).toBe(50);
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ page: 1, per_page: 50 }),
      }),
    );
  }));

  it('deep-link con page fuori range: corregge stato e query params', fakeAsync(() => {
    (route.snapshot as { queryParamMap: unknown }).queryParamMap = convertToParamMap({
      page: '999',
      per_page: '10',
    });

    const store = TestBed.inject(usersServiceInjectionToken);
    tick();

    expect(store.page()).toBe(1);
    expect(usersApi.list.calls.count()).toBe(2);
    expect(usersApi.list.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ page: 999 }));
    expect(usersApi.list.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({ page: 1 }));
    expect(usersApi.list.calls.argsFor(1)[1]).toEqual({ cache: true });
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ page: 1, per_page: 10 }),
      }),
    );
  }));
});
