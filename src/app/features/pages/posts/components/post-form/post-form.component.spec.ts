import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { UsersLookupService } from '@/app/shared/services/users/users-lookup.service';
import { ToastService } from '@/app/shared/ui/toast/toast.service';

import { PostForm } from './post-form.component';

const mockUser: User = {
  id: 2,
  name: 'Author',
  email: 'author@example.com',
  status: 'active',
};

const mockPost: Post = {
  id: 101,
  user_id: mockUser.id,
  title: 'Original title',
  body: 'Original body content that is long enough',
};

class DialogRefStub {
  close = jasmine.createSpy('close');
  disableClose = false;
}

class UsersLookupStub {
  private cache = signal<User[]>([]);
  readonly users = computed(() => this.cache());
  readonly isLoading = computed(() => false);

  ensureUsersLoaded = jasmine.createSpy('ensureUsersLoaded').and.returnValue(of([]));
  ensureUserInCache = jasmine.createSpy('ensureUserInCache').and.returnValue(of(mockUser));
  seed = jasmine.createSpy('seed').and.callFake((users: User[]) => this.cache.set(users));

  setUsers(users: User[]): void {
    this.cache.set(users);
  }
}

describe('PostForm', () => {
  let fixture: ComponentFixture<PostForm>;
  let component: PostForm;
  let postsApi: jasmine.SpyObj<PostsApiService>;
  let toast: jasmine.SpyObj<ToastService>;
  let usersLookup: UsersLookupStub;
  let dialogRef: DialogRefStub;

  const buildModule = (dialogData: { users?: User[]; post?: Post | null } = {}) => {
    postsApi = jasmine.createSpyObj('PostsApiService', ['create', 'update']);
    toast = jasmine.createSpyObj('ToastService', ['show']);
    usersLookup = new UsersLookupStub();
    dialogRef = new DialogRefStub();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PostForm],
      providers: [
        { provide: PostsApiService, useValue: postsApi },
        { provide: ToastService, useValue: toast },
        { provide: UsersLookupService, useValue: usersLookup },
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: {
            users: dialogData.users ?? [],
            post: dialogData.post ?? null,
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: (key: string, params?: Record<string, string | number>) =>
              params ? `${key}:${JSON.stringify(params)}` : key,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(PostForm);
    component = fixture.componentInstance;
    usersLookup.setUsers(dialogData.users ?? []);
    fixture.detectChanges();
  };

  const fillValidForm = (
    title = 'New title',
    body = 'This body content is intentionally longer than twenty characters',
  ): void => {
    usersLookup.setUsers([mockUser]);
    component['userIdControl'].enable({ emitEvent: false });
    component['userIdControl'].setValue(mockUser.id);
    component['titleControl'].setValue(`  ${title}  `);
    component['bodyControl'].setValue(body);
    component.form.updateValueAndValidity({ emitEvent: false });
    fixture.detectChanges();
  };

  it('defaults to create mode and seeds prefetched users', () => {
    buildModule({ users: [mockUser] });

    expect(component.isEdit()).toBeFalse();
    expect(component.dialogTitle()).toBe('postForm.titleNew');
    expect(component.submitLabel()).toBe('postForm.buttons.create');
    expect(usersLookup.seed).toHaveBeenCalledWith([mockUser]);
  });

  it('adds a fallback option when the editing author is not in the cached list', () => {
    const missingAuthorId = 999;
    const postWithMissingAuthor: Post = {
      ...mockPost,
      user_id: missingAuthorId,
    };

    buildModule({ post: postWithMissingAuthor, users: [mockUser] });
    const options = component.userOptions();

    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toEqual({
      value: missingAuthorId,
      label: `postForm.missingAuthor:${JSON.stringify({ id: missingAuthorId })}`,
    });
  });

  it('allows submission when editing with a missing author', fakeAsync(() => {
    const missingAuthorId = 12345;
    const postWithMissingAuthor: Post = {
      ...mockPost,
      user_id: missingAuthorId,
    };
    const updatedPost: Post = {
      ...postWithMissingAuthor,
      title: 'Updated title',
      body: 'Updated body that also satisfies validation',
    };

    buildModule({ post: postWithMissingAuthor, users: [mockUser] });
    component['titleControl'].setValue(updatedPost.title);
    component['bodyControl'].setValue(updatedPost.body);
    component['userIdControl'].setValue(missingAuthorId);
    postsApi.update.and.returnValue(of(updatedPost));

    component.submit();
    tick();

    expect(postsApi.update).toHaveBeenCalledWith(postWithMissingAuthor.id, {
      user_id: missingAuthorId,
      title: updatedPost.title,
      body: updatedPost.body,
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ status: 'updated', post: updatedPost });
  }));

  it('calls the create API and closes with the created post', fakeAsync(() => {
    const createdPost: Post = {
      id: 202,
      user_id: mockUser.id,
      title: 'Created title',
      body: 'Created body that also satisfies validation',
    };

    buildModule({ users: [mockUser] });
    fillValidForm(createdPost.title, createdPost.body);
    postsApi.create.and.returnValue(of(createdPost));

    component.submit();
    tick();

    expect(postsApi.create).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith({ status: 'created', post: createdPost });
    expect(dialogRef.disableClose).toBeFalse();
    expect(component.submitting()).toBeFalse();
  }));

  it('uses the update API when editing an existing post', fakeAsync(() => {
    const updated: Post = {
      ...mockPost,
      title: 'Updated title',
      body: 'Updated body with enough characters',
    };

    buildModule({ post: mockPost, users: [mockUser] });
    fillValidForm(updated.title, updated.body);
    postsApi.update.and.returnValue(of(updated));

    component.submit();
    tick();

    expect(postsApi.update).toHaveBeenCalledWith(mockPost.id, {
      user_id: mockUser.id,
      title: 'Updated title',
      body: 'Updated body with enough characters',
    });
    expect(dialogRef.close).toHaveBeenCalledWith({ status: 'updated', post: updated });
  }));

  it('sets title errors when validation fails', fakeAsync(() => {
    buildModule({ users: [mockUser] });
    fillValidForm();
    postsApi.create.and.returnValue(throwError(() => ({ status: 422 })));

    component.submit();
    tick();

    expect(component['titleControl'].errors?.api).toBeTrue();
  }));

  it('shows rate limit toast when status is 429', fakeAsync(() => {
    buildModule({ users: [mockUser] });
    fillValidForm();
    postsApi.create.and.returnValue(throwError(() => ({ status: 429 })));

    component.submit();
    tick();

    expect(toast.show).toHaveBeenCalledWith('error', 'postForm.errors.rateLimit');
  }));

  it('shows a fallback toast for other failures', fakeAsync(() => {
    buildModule({ users: [mockUser] });
    fillValidForm();
    postsApi.create.and.returnValue(throwError(() => ({ status: 500 })));

    component.submit();
    tick();

    expect(toast.show).toHaveBeenCalledWith('error', 'postForm.errors.saveFailed');
  }));
});
