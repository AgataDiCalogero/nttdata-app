import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_SET = new Set<ButtonVariant>(['primary', 'secondary', 'outline', 'ghost', 'danger']);
const SIZE_SET = new Set<ButtonSize>(['sm', 'md', 'lg']);

@Component({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
  templateUrl: './button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn',
    '[class.btn--primary]': 'isPrimary',
    '[class.btn--secondary]': 'isSecondary',
    '[class.btn--outline]': 'isOutline',
    '[class.btn--ghost]': 'isGhost',
    '[class.btn--danger]': 'isDanger',
    '[class.btn--sm]': 'isSmall',
    '[class.btn--lg]': 'isLarge',
    '[class.btn--icon]': 'isIconOnly',
    '[class.btn--block]': 'isFullWidth',
    '[class.btn--loading]': 'isLoadingClass',
    '[attr.aria-busy]': 'ariaBusy',
    '[attr.data-variant]': 'dataVariant',
    '[attr.data-size]': 'dataSize',
  },
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly iconOnly = input(false);
  readonly fullWidth = input(false);
  readonly loading = input(false);

  private readonly resolvedVariant = computed<ButtonVariant>(() => {
    const variant = this.variant();
    return VARIANT_SET.has(variant) ? variant : 'primary';
  });

  private readonly resolvedSize = computed<ButtonSize>(() => {
    const size = this.size();
    return SIZE_SET.has(size) ? size : 'md';
  });

  protected get isPrimary(): boolean {
    return this.resolvedVariant() === 'primary';
  }
  protected get isSecondary(): boolean {
    return this.resolvedVariant() === 'secondary';
  }
  protected get isOutline(): boolean {
    return this.resolvedVariant() === 'outline';
  }
  protected get isGhost(): boolean {
    return this.resolvedVariant() === 'ghost';
  }
  protected get isDanger(): boolean {
    return this.resolvedVariant() === 'danger';
  }
  protected get isSmall(): boolean {
    return this.resolvedSize() === 'sm';
  }
  protected get isLarge(): boolean {
    return this.resolvedSize() === 'lg';
  }
  protected get isIconOnly(): boolean {
    return this.iconOnly();
  }
  protected get isFullWidth(): boolean {
    return this.fullWidth();
  }
  protected get isLoadingClass(): boolean {
    return this.loading();
  }
  protected get ariaBusy(): 'true' | null {
    return this.loading() ? 'true' : null;
  }
  protected get dataVariant(): ButtonVariant {
    return this.resolvedVariant();
  }
  protected get dataSize(): ButtonSize {
    return this.resolvedSize();
  }
}
