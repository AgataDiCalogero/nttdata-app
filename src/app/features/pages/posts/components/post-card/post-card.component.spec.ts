import { CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import type { Comment as ModelComment, Post } from '@/app/shared/models/post';

import { PostCardComponent } from './post-card.component';

@Component({
  selector: 'app-post-comments',
  standalone: true,
  template: '',
})
class StubPostCommentsComponent {
  @Input() postId!: number;
  @Input() comments: ModelComment[] = [];
  @Input() loading = false;
  @Input() hideComposer = false;
  @Output() commentCreated = new EventEmitter<ModelComment>();
  @Output() commentUpdated = new EventEmitter<ModelComment>();
  @Output() commentDeleted = new EventEmitter<number>();
  @Output() composerCancelled = new EventEmitter<void>();
}

describe('PostCardComponent', () => {
  let fixture: ComponentFixture<PostCardComponent>;
  let component: PostCardComponent;
  let toggleSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.overrideComponent(PostCardComponent, {
      set: {
        imports: [
          CommonModule,
          MatIconModule,
          MatCardModule,
          ButtonComponent,
          TranslatePipe,
          StubPostCommentsComponent,
        ],
      },
    });

    TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: I18nService,
          useValue: {
            translate: (key: string, params?: Record<string, unknown>) => {
              if (key === 'userDetail.avatarFallback') return 'User';
              if (key === 'postCard.unknownAuthor') return 'Unknown author';
              return typeof params?.name === 'string' ? params.name : key;
            },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(PostCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('post', {
      id: 1,
      user_id: 2,
      title: 'Test title',
      body: 'Lorem ipsum dolor sit amet',
    } as Post);
    toggleSpy = jasmine.createSpy('toggleComments');
    component.toggleComments.subscribe(toggleSpy);
    fixture.detectChanges();
  });

  it('calcola autore fallback usando user_id quando mancante', () => {
    fixture.componentRef.setInput('authorName', null);
    fixture.detectChanges();

    expect(component.author()).toBe('User #2');
  });

  it('toggleExpansion alterna la visualizzazione del testo', () => {
    expect(component.isExpanded).toBeFalse();
    component.toggleExpansion();
    expect(component.isExpanded).toBeTrue();
    component.toggleExpansion();
    expect(component.isExpanded).toBeFalse();
  });

  it('openCommentsList apre e chiude i commenti emettendo toggle', () => {
    fixture.componentRef.setInput('commentsLoaded', false);
    fixture.detectChanges();

    component.openCommentsList();
    expect(component.openSection).toBe('comments');
    expect(toggleSpy).toHaveBeenCalledTimes(1);

    component.openCommentsList();
    expect(component.openSection).toBe('none');
    expect(toggleSpy).toHaveBeenCalledTimes(2);
  });

  it('openComposer emette toggle se i commenti non sono caricati e permette il toggle back', () => {
    fixture.componentRef.setInput('commentsLoaded', false);
    fixture.componentRef.setInput('commentsLoading', false);
    fixture.detectChanges();

    component.openComposer();
    expect(component.openSection).toBe('composer');
    expect(toggleSpy).toHaveBeenCalledTimes(1);

    component.openComposer();
    expect(component.openSection).toBe('none');
    expect(toggleSpy).toHaveBeenCalledTimes(1);
  });

  it('commentCount usa commentsPreviewCount quando presente', () => {
    fixture.componentRef.setInput('comments', [{ id: 10 } as ModelComment]);
    fixture.componentRef.setInput('commentsPreviewCount', 7);
    fixture.detectChanges();

    expect(component.commentCount).toBe(7);
  });

  it('shouldTruncate ritorna true per testi lunghi', () => {
    fixture.componentRef.setInput('post', {
      id: 2,
      user_id: 3,
      title: 'Long',
      body: 'a'.repeat(400),
    } as Post);
    fixture.detectChanges();

    expect(component.shouldTruncate()).toBeTrue();
    expect(component.previewText().endsWith('...')).toBeTrue();
  });
});
