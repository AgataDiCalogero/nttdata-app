import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import type { PostFilters } from '@/app/shared/models/post';

export type PostsFiltersFormGroup = FormGroup<{
  title: FormControl<string>;
  user_id: FormControl<number>;
}>;

@Injectable()
export class PostsFiltersService {
  private readonly fb = inject(FormBuilder);

  readonly form: PostsFiltersFormGroup = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control<string>(''),
    user_id: this.fb.nonNullable.control<number>(0),
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
    this.form.controls.user_id.valueChanges.pipe(
      startWith(this.form.controls.user_id.value),
      distinctUntilChanged(),
    ),
    { initialValue: this.form.controls.user_id.value },
  );

  private readonly internalFilters = signal<PostFilters>({
    title: this.normalizeTitle(this.titleChanges()),
    user_id: this.normalizeUserId(this.userIdChanges()),
  });

  readonly filters = computed(() => this.internalFilters());

  constructor() {
    effect(() => {
      const title = this.normalizeTitle(this.titleChanges());
      const userId = this.normalizeUserId(this.userIdChanges());
      const current = this.internalFilters();
      if (current.title === title && current.user_id === userId) {
        return;
      }
      this.internalFilters.set({ title, user_id: userId });
    });
  }

  reset(): void {
    this.form.reset({ title: '', user_id: 0 });
  }

  patch(filters: PostFilters): void {
    this.form.patchValue({
      title: filters.title ?? '',
      user_id: filters.user_id ?? 0,
    });
  }

  private normalizeTitle(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeUserId(value: number): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
  }
}
