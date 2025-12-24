import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Comment } from '@/app/shared/models/post';
import { ToastService } from '@/app/shared/ui/toast/toast.service';

import { CommentFormComponent } from './comment-form.component';

const mockComment: Comment = {
  id: 99,
  post_id: 1,
  name: 'Tester',
  email: 'test@example.com',
  body: 'This is a test comment',
};

class CommentsFacadeStub {
  createComment = jasmine.createSpy('createComment').and.returnValue(of(mockComment));
}

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommentFormComponent],
  template: `<app-comment-form [postId]="postId" [placeholder]="placeholder"></app-comment-form>`,
})
class CommentFormHostComponent {
  postId = 1;
  placeholder = '';
}

describe('CommentFormComponent', () => {
  let hostFixture: ComponentFixture<CommentFormHostComponent>;
  let component: CommentFormComponent;
  let commentsFacade: CommentsFacadeStub;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    commentsFacade = new CommentsFacadeStub();
    toast = jasmine.createSpyObj('ToastService', ['show']);

    TestBed.configureTestingModule({
      imports: [CommentFormHostComponent],
      providers: [
        { provide: CommentsFacadeService, useValue: commentsFacade },
        { provide: ToastService, useValue: toast },
        { provide: I18nService, useValue: { translate: (key: string) => key } },
      ],
    });

    hostFixture = TestBed.createComponent(CommentFormHostComponent);
    hostFixture.detectChanges();
    component = hostFixture.debugElement.query(
      By.directive(CommentFormComponent),
    )!.componentInstance;
  });

  const fillValidForm = (): void => {
    const form = component['form'];
    form.controls.name.setValue('Alice');
    form.controls.email.setValue('alice@example.com');
    form.controls.body.setValue('This comment body is long enough');
  };

  it('emits a created comment and resets state on success', fakeAsync(() => {
    fillValidForm();
    const created: Comment[] = [];
    component.created.subscribe((value) => created.push(value));

    component.submit();
    tick();

    expect(commentsFacade.createComment).toHaveBeenCalledWith(1, {
      name: 'Alice',
      email: 'alice@example.com',
      body: 'This comment body is long enough',
    });
    expect(toast.show).toHaveBeenCalledWith('success', 'commentForm.toastSuccess');
    expect(component.submitError()).toBeNull();
    expect(component.submitting()).toBeFalse();
    expect(created).toEqual([mockComment]);
  }));

  it('avoids submitting when the form is invalid', () => {
    component.submit();
    expect(commentsFacade.createComment).not.toHaveBeenCalled();
    expect(component.submitting()).toBeFalse();
  });

  it('updates submitError when the server returns validation errors', fakeAsync(() => {
    commentsFacade.createComment.and.returnValue(throwError(() => ({ status: 422 })));
    fillValidForm();

    component.submit();
    tick();

    expect(toast.show).toHaveBeenCalledWith('error', 'commentForm.submitErrors.validation');
    expect(component.submitError()).toBe('commentForm.submitErrors.validation');
    expect(component.submitting()).toBeFalse();
  }));

  it('handles rate limit responses gracefully', fakeAsync(() => {
    commentsFacade.createComment.and.returnValue(throwError(() => ({ status: 429 })));
    fillValidForm();

    component.submit();
    tick();

    expect(toast.show).toHaveBeenCalledWith('error', 'commentForm.submitErrors.rateLimit');
    expect(component.submitError()).toBe('commentForm.submitErrors.rateLimit');
    expect(component.submitting()).toBeFalse();
  }));

  it('handles generic failures with a fallback message', fakeAsync(() => {
    commentsFacade.createComment.and.returnValue(throwError(() => ({ status: 500 })));
    fillValidForm();

    component.submit();
    tick();

    expect(toast.show).toHaveBeenCalledWith('error', 'commentForm.submitErrors.publishFailed');
    expect(component.submitError()).toBe('commentForm.submitErrors.publishFailed');
  }));

  it('returns additional aria descriptors when the body field is invalid and touched', () => {
    const bodyControl = component['form'].controls.body;
    bodyControl.setValue('');
    bodyControl.markAsTouched();

    const describedBy = component.bodyDescribedBy;
    expect(describedBy).toContain('comment-body-error');
  });

  it('falls back to the translation placeholder when no custom text is provided', () => {
    (hostFixture.componentInstance as CommentFormHostComponent).placeholder = '';
    hostFixture.detectChanges();
    expect(component['placeholderText']()).toBe('commentForm.placeholders.body');
  });
});
