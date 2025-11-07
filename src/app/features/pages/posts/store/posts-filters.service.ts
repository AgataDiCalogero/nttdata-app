import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';

import type { PostFilters } from '@/app/shared/models/post';

export type PostsFiltersFormGroup = FormGroup<{
  title: FormControl<string>;
  userId: FormControl<number | null>;
}>;

@Injectable()
export class PostsFiltersService {
  private readonly fb = inject(FormBuilder);

  readonly form: PostsFiltersFormGroup = this.fb.group({
    title: this.fb.nonNullable.control<string>(''),
    userId: this.fb.control<number | null>(0),
  });

  private readonly titleChanges = toSignal(
    this.form.controls.title.valueChanges.pipe(
      startWith(this.form.controls.title.value),
      debounceTime(300),
      map((value) => value.trim()),
    ),
    { initialValue: this.form.controls.title.value.trim() },
  );

  private readonly userIdChanges = toSignal(
    this.form.controls.userId.valueChanges.pipe(
      startWith(this.form.controls.userId.value),
      distinctUntilChanged(),
    ),
    { initialValue: this.form.controls.userId.value },
  );

  private readonly internalFilters = signal<PostFilters>({
    title: this.normalizeTitle(this.titleChanges()),
    userId: this.normalizeUserId(this.userIdChanges()),
  });

  readonly filters = computed(() => this.internalFilters());

  constructor() {
    effect(() => {
      const title = this.normalizeTitle(this.titleChanges());
      const userId = this.normalizeUserId(this.userIdChanges());
      const current = this.internalFilters();
      if (current.title === title && current.userId === userId) {
        return;
      }
      this.internalFilters.set({ title, userId });
    });
  }

  reset(): void {
    this.form.reset({ title: '', userId: 0 });
  }

  patch(filters: PostFilters): void {
    this.form.patchValue({
      title: filters.title ?? '',
      userId: filters.userId ?? 0,
    });
  }

  private normalizeTitle(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeUserId(value: number | null): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  }
}
