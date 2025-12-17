import { CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import type { Post } from '@/app/shared/models/post';

import { PostCardComponent } from './post-card.component';

describe('PostCardComponent', () => {
  let fixture: ComponentFixture<PostCardComponent>;
  let component: PostCardComponent;
  let viewCommentsSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.overrideComponent(PostCardComponent, {
      set: {
        imports: [CommonModule, MatIconModule, MatCardModule, ButtonComponent, TranslatePipe],
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
    viewCommentsSpy = jasmine.createSpy('viewComments');
    component.viewComments.subscribe(viewCommentsSpy);
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

  it('emits viewComments with the current post', () => {
    component.onViewComments();
    expect(viewCommentsSpy).toHaveBeenCalledWith({
      id: 1,
      user_id: 2,
      title: 'Test title',
      body: 'Lorem ipsum dolor sit amet',
    });
  });

  it('commentCount usa commentsPreviewCount quando presente', () => {
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
