import { Dialog } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LUCIDE_ICONS } from 'lucide-angular';
import { Observable, of, Subject, throwError } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';

import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import type { Comment } from '@/app/shared/models/post';

import { PostCommentsComponent } from './post-comments.component';

describe('PostCommentsComponent', () => {
  let fixture: ComponentFixture<PostCommentsComponent>;
  let component: PostCommentsComponent;
  let postsApi: jasmine.SpyObj<PostsApiService>;
  let toast: jasmine.SpyObj<ToastService>;
  let overlays: jasmine.SpyObj<UiOverlayService>;
  let dialog: { open: jasmine.Spy };

  beforeEach(() => {
    postsApi = jasmine.createSpyObj('PostsApiService', ['deleteComment', 'updateComment']);
    toast = jasmine.createSpyObj('ToastService', ['show']);
    overlays = jasmine.createSpyObj('UiOverlayService', ['activate', 'release']);
    const closed$ = new Subject<void>();
    dialog = {
      open: jasmine
        .createSpy('open')
        .and.returnValue({ closed: closed$.asObservable(), close: () => closed$.next() }),
    };

    TestBed.configureTestingModule({
      imports: [PostCommentsComponent],
      providers: [
        { provide: Dialog, useValue: dialog },
        { provide: PostsApiService, useValue: postsApi },
        { provide: ToastService, useValue: toast },
        { provide: UiOverlayService, useValue: overlays },
        { provide: I18nService, useValue: { translate: (key: string) => key } },
        { provide: LUCIDE_ICONS, useValue: [] },
      ],
    });

    fixture = TestBed.createComponent(PostCommentsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('postId', 1);
    fixture.detectChanges();
  });

  it('apre dialog di delete e conferma eliminazione con toast successo', (done) => {
    const deletedSpy = jasmine.createSpy('deleted');
    component.commentDeleted.subscribe(deletedSpy);
    const comment: Comment = { id: 10, post_id: 1, body: 'b', email: 'a@b.com', name: 'Test' };
    postsApi.deleteComment.and.returnValue(of(void 0));

    component.deleteComment(comment);
    const data = dialog.open.calls.mostRecent().args[1].data as DeleteConfirmData;

    const obs$ = (data.confirmAction as (() => Observable<void>) | undefined)?.();
    obs$?.subscribe(() => {
      expect(postsApi.deleteComment).toHaveBeenCalledWith(10);
      expect(deletedSpy).toHaveBeenCalledWith(10);
      expect(toast.show).toHaveBeenCalledWith('success', 'postComments.toast.deleted');
      expect(overlays.activate).toHaveBeenCalled();
      done();
    });
  });

  it('gestisce errore 429 su delete mostrando toast errore', (done) => {
    const comment: Comment = { id: 11, post_id: 1, body: 'b', email: 'a@b.com', name: 'Test' };
    postsApi.deleteComment.and.returnValue(
      throwError(() => ({ status: 429, message: 'rate limit' })),
    );

    component.deleteComment(comment);
    const data = dialog.open.calls.mostRecent().args[1].data as DeleteConfirmData;

    const obs$ = (data.confirmAction as (() => Observable<void>) | undefined)?.();
    obs$?.subscribe({
      error: () => {
        expect(toast.show).toHaveBeenCalledWith('error', 'postComments.errors.rateLimit');
        expect(component.deletingId()).toBeNull();
        done();
      },
    });
  });

  it('salva edit e gestisce 422/429', () => {
    const comment: Comment = { id: 12, post_id: 1, body: 'old', email: 'e@x.com', name: 'N' };
    component.startEdit(comment);
    component.editForm.controls.body.setValue(' new body ');

    postsApi.updateComment.and.returnValue(
      of({ id: 12, post_id: 1, body: 'new body', email: 'e@x.com', name: 'N' } as Comment),
    );
    const updatedSpy = jasmine.createSpy('updated');
    component.commentUpdated.subscribe(updatedSpy);

    component.saveEdit(comment);
    expect(postsApi.updateComment).toHaveBeenCalledWith(12, { body: 'new body' });
    expect(updatedSpy).toHaveBeenCalled();
    expect(component.editingId()).toBeNull();

    component.startEdit(comment);
    component.editForm.controls.body.setValue('invalid');
    postsApi.updateComment.and.returnValue(throwError(() => ({ status: 422, message: 'invalid' })));
    component.saveEdit(comment);
    expect(component.editError()).toBe('postComments.errors.editInvalid');

    postsApi.updateComment.and.returnValue(throwError(() => ({ status: 429, message: 'limit' })));
    component.saveEdit(comment);
    expect(toast.show).toHaveBeenCalledWith('error', 'postComments.errors.rateLimit');
  });
});
