import { Injectable, signal } from '@angular/core';

@Injectable()
export class PostCardCoordinatorService {
  private readonly _openCommentsPostId = signal<number | null>(null);
  readonly openCommentsPostId = this._openCommentsPostId.asReadonly();

  toggleCommentsFor(postId: number): boolean {
    const next = this._openCommentsPostId() === postId ? null : postId;
    this._openCommentsPostId.set(next);
    return next === postId;
  }

  closeAllComments(): void {
    this._openCommentsPostId.set(null);
  }
}
