import { Injectable, inject } from '@angular/core';

import { OverlayKey, UiOverlayService } from './ui-overlay.service';

@Injectable({ providedIn: 'root' })
export class DialogOverlayCoordinator {
  private readonly overlays = inject(UiOverlayService);

  coordinate(
    key: OverlayKey,
    dialogRef: { close(): void },
    blockGlobalControls = true,
  ): () => void {
    this.overlays.activate({
      key,
      close: () => dialogRef.close(),
      blockGlobalControls,
    });

    return () => this.overlays.release(key);
  }
}

export { OverlayKey };
