import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import type { DeleteConfirmData } from '@app/shared/models/dialog';
import type { Post } from '@app/shared/models/post';
import { ResponsiveDialogService } from '@app/shared/services/dialog/responsive-dialog.service';
import { NotificationsService } from '@app/shared/services/notifications/notifications.service';
import { DialogOverlayCoordinator } from '@app/shared/services/ui-overlay/dialog-overlay-coordinator.service';

import { PostsUiService } from './posts-ui.service';
import { postsServiceInjectionToken } from '../store/posts.inject';

describe('PostsUiService', () => {
  let service: PostsUiService;
  let dialog: jasmine.SpyObj<Dialog>;
  let overlays: { activate: jasmine.Spy; release: jasmine.Spy };
  let notifications: { showSuccess: jasmine.Spy };
  let dialogLayouts: { form: jasmine.Spy };
  let overlayCoordinator: jasmine.SpyObj<DialogOverlayCoordinator>;
  let closed$: Subject<unknown>;

  const mockStore = {
    userOptions: jasmine.createSpy('userOptions').and.returnValue([{ id: 1, name: 'User 1' }]),
    setPage: jasmine.createSpy('setPage'),
    refresh: jasmine.createSpy('refresh'),
    onPostUpdated: jasmine.createSpy('onPostUpdated'),
    deletePostRequest: jasmine.createSpy('deletePostRequest').and.returnValue(of(void 0)),
  };

  beforeEach(() => {
    closed$ = new Subject<unknown>();

    dialog = jasmine.createSpyObj('Dialog', ['open']);
    overlays = { activate: jasmine.createSpy('activate'), release: jasmine.createSpy('release') };
    notifications = { showSuccess: jasmine.createSpy('showSuccess') };
    dialogLayouts = {
      form: jasmine.createSpy('form').and.callFake((cfg) => cfg),
    };
    overlayCoordinator = jasmine.createSpyObj('DialogOverlayCoordinator', ['coordinate']);
    overlayCoordinator.coordinate.and.callFake((key, dialogRef) => {
      overlays.activate({
        key,
        close: () => dialogRef.close(),
        blockGlobalControls: true,
      });
      return () => overlays.release(key);
    });

    dialog.open.and.callFake(
      () =>
        ({
          closed: closed$.asObservable() as Observable<DeleteConfirmData | undefined>,
          close: () => closed$.next(null),
        }) as DialogRef<DeleteConfirmData>,
    );

    TestBed.configureTestingModule({
      providers: [
        PostsUiService,
        { provide: Dialog, useValue: dialog },
        { provide: postsServiceInjectionToken, useValue: mockStore },
        { provide: DialogOverlayCoordinator, useValue: overlayCoordinator },
        { provide: ResponsiveDialogService, useValue: dialogLayouts },
        { provide: NotificationsService, useValue: notifications },
        {
          provide: I18nService,
          useValue: { translate: (k: string) => k },
        },
      ],
    });

    service = TestBed.inject(PostsUiService);
  });

  it('apre il dialog di creazione post con utenti pre-caricati e gestisce success', () => {
    service.openCreateDialog();

    expect(dialog.open).toHaveBeenCalled();
    const config = dialog.open.calls.mostRecent().args[1] as { data?: { users?: unknown } };
    expect(config.data?.users).toEqual([{ id: 1, name: 'User 1' }]);
    expect(overlays.activate).toHaveBeenCalledWith(jasmine.objectContaining({ key: 'post-form' }));
    expect(overlayCoordinator.coordinate).toHaveBeenCalledWith(
      'post-form',
      jasmine.objectContaining({ close: jasmine.any(Function) }),
    );

    closed$.next({ status: 'created' });

    expect(notifications.showSuccess).toHaveBeenCalled();
    expect(mockStore.setPage).toHaveBeenCalledWith(1);
    expect(mockStore.refresh).toHaveBeenCalled();
    expect(overlays.release).toHaveBeenCalledWith('post-form');
  });

  it('apre il dialog di edit con dati post e gestisce update', () => {
    service.openEditDialog({ id: 5, user_id: 1, title: 'T', body: 'B' } as Post);

    const config = dialog.open.calls.mostRecent().args[1] as { data?: { post?: Post } };
    expect(config.data?.post?.id).toBe(5);

    closed$.next({
      status: 'updated',
      post: { id: 5, user_id: 1, title: 'T2', body: 'B' } as Post,
    });

    expect(notifications.showSuccess).toHaveBeenCalled();
    expect(mockStore.onPostUpdated).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'T2' }));
    expect(overlays.release).toHaveBeenCalledWith('post-form');
    expect(overlayCoordinator.coordinate).toHaveBeenCalledWith(
      'post-form',
      jasmine.objectContaining({ close: jasmine.any(Function) }),
    );
  });

  it('confirmDelete invoca deletePostRequest e overlay', () => {
    const post = { id: 9, user_id: 1, title: 'X', body: 'Y' } as Post;
    service.confirmDelete(post);

    const latest = dialog.open.calls.mostRecent();
    const data = (latest.args[1] as { data?: DeleteConfirmData }).data!;
    expect(data.title).toBe('posts.delete.title');
    const result$ = (data.confirmAction as () => Observable<void>)();
    result$.subscribe();
    expect(mockStore.deletePostRequest).toHaveBeenCalledWith(post);
    expect(overlays.activate).toHaveBeenCalledWith(
      jasmine.objectContaining({ key: 'post-delete-confirm' }),
    );
    expect(overlayCoordinator.coordinate).toHaveBeenCalledWith(
      'post-delete-confirm',
      jasmine.objectContaining({ close: jasmine.any(Function) }),
    );
  });
});
