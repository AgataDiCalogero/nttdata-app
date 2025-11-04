import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingOverlayService } from '@app/shared/services/loading/loading-overlay.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    @if (loading.isLoading()) {
      <div class="loading-overlay" role="status" aria-live="polite">
        <mat-progress-bar mode="indeterminate" color="accent"></mat-progress-bar>
      </div>
    }
  `,
  styleUrls: ['./loading-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  protected readonly loading = inject(LoadingOverlayService);
}
