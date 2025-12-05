import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';

import { UsersApiService } from '@app/shared/data-access/users/users-api.service';
import { I18nService } from '@app/shared/i18n/i18n.service';
import type { User } from '@app/shared/models/user';
import { ResponsiveDialogService } from '@app/shared/services/dialog/responsive-dialog.service';
import { NotificationsService } from '@app/shared/services/notifications/notifications.service';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';

import { usersServiceInjectionToken } from './store/users.inject';
import { UsersUiService } from './users-ui.service';

describe('UsersUiService', () => {
  let service: UsersUiService;
  let dialog: jasmine.SpyObj<Dialog>;
  let overlays: jasmine.SpyObj<UiOverlayService>;
  let notifications: jasmine.SpyObj<NotificationsService>;
  let dialogLayouts: jasmine.SpyObj<ResponsiveDialogService>;
  let usersApi: jasmine.SpyObj<UsersApiService>;
  let closed$: Subject<unknown>;

  const mockStore = {
    loadUsers: jasmine.createSpy('loadUsers'),
    setDeleting: jasmine.createSpy('setDeleting'),
  };

  beforeEach(() => {
    closed$ = new Subject<unknown>();

    dialog = jasmine.createSpyObj('Dialog', ['open']);
    overlays = jasmine.createSpyObj('UiOverlayService', ['activate', 'release']);
    notifications = jasmine.createSpyObj('NotificationsService', ['showSuccess', 'showHttpError']);
    dialogLayouts = jasmine.createSpyObj('ResponsiveDialogService', ['form']);
    dialogLayouts.form.and.callFake((cfg) => cfg);
    usersApi = jasmine.createSpyObj('UsersApiService', ['getById', 'delete']);

    dialog.open.and.callFake(() => ({
      closed: closed$.asObservable(),
      close: () => closed$.next(null),
    }));

    usersApi.getById.and.returnValue(of({ id: 1, name: 'Alice', email: 'a@test.com' } as User));
    usersApi.delete.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        UsersUiService,
        { provide: Dialog, useValue: dialog },
        { provide: UiOverlayService, useValue: overlays },
        { provide: ResponsiveDialogService, useValue: dialogLayouts },
        { provide: NotificationsService, useValue: notifications },
        { provide: UsersApiService, useValue: usersApi },
        { provide: I18nService, useValue: { translate: (k: string) => k } },
        { provide: usersServiceInjectionToken, useValue: mockStore },
      ],
    });

    service = TestBed.inject(UsersUiService);
  });

  it('openCreateUserModal mostra successo e reload dopo chiusura', () => {
    service.openCreateUserModal();

    expect(dialog.open).toHaveBeenCalled();
    const openArgs = dialog.open.calls.mostRecent().args[1];
    expect(openArgs?.ariaLabel).toBe('users.create.ariaLabel');
    expect(overlays.activate).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'user-form' }));

    closed$.next('success');

    expect(notifications.showSuccess).toHaveBeenCalledWith('users.create.success');
    expect(mockStore.loadUsers).toHaveBeenCalledWith({ pushUrl: false });
    expect(overlays.release).toHaveBeenCalledWith('user-form');
  });

  it('openEditUserModal carica utente, apre dialog e gestisce successo', () => {
    service.openEditUserModal(1);

    const config = dialog.open.calls.mostRecent().args[1];
    expect(usersApi.getById).toHaveBeenCalledWith(1);
    expect(config?.data?.user?.id).toBe(1);

    closed$.next('success');

    expect(notifications.showSuccess).toHaveBeenCalledWith('users.update.success');
    expect(mockStore.loadUsers).toHaveBeenCalledWith({ pushUrl: false });
    expect(overlays.release).toHaveBeenCalledWith('user-form');
  });

  it('confirmDelete chiama delete e refresha lo store', () => {
    service.confirmDelete({ id: 7, name: 'Bob' } as User);

    const data = dialog.open.calls.mostRecent().args[1].data;
    expect(data.title).toBe('users.delete.title');
    const obs$ = (data.confirmAction as () => Observable<void>)();
    obs$.subscribe();

    expect(mockStore.setDeleting).toHaveBeenCalledWith(7);
    expect(usersApi.delete).toHaveBeenCalledWith(7);
    expect(notifications.showSuccess).toHaveBeenCalledWith('users.delete.success');
  });

  it('openEditUserModal gestisce errore caricamento utente', () => {
    usersApi.getById.and.returnValue(throwError(() => ({ status: 500 })));
    service.openEditUserModal(2);
    expect(notifications.showHttpError).toHaveBeenCalled();
  });
});
