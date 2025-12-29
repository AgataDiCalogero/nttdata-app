import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom, isObservable } from 'rxjs';

import { I18nService } from '@/app/shared/i18n/i18n.service';
import { TranslatePipe } from '@/app/shared/i18n/translate.pipe';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import { AlertComponent } from '@/app/shared/ui/alert/alert.component';
import { ButtonComponent } from '@/app/shared/ui/button/button.component';

@Component({
  selector: 'app-delete-confirm',
  standalone: true,
  imports: [
    ButtonComponent,
    AlertComponent,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './delete-confirm.component.html',
  styleUrls: ['./delete-confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<DeleteConfirmData>(DIALOG_DATA);
  private readonly i18n = inject(I18nService);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly confirmLabel = computed(() => {
    if (this.submitting()) {
      return this.data.inProgressText ?? this.i18n.translate('common.actions.deleting');
    }
    return this.data.confirmText ?? this.i18n.translate('common.actions.delete');
  });

  async confirm(): Promise<void> {
    if (this.submitting()) return;

    const action = this.data.confirmAction;
    if (!action) {
      this.dialogRef.close(true);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
      const result = action();
      if (isObservable(result)) {
        await firstValueFrom(result);
      } else if (result instanceof Promise) {
        await result;
      }
      this.dialogRef.close(true);
    } catch (err) {
      console.error('Delete action failed', err);
      const fallback = this.data.errorMessage ?? this.i18n.translate('common.errors.actionFailed');
      const derived =
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof err.message === 'string'
          ? err.message
          : fallback;
      this.errorMessage.set(derived || fallback);
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
