import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  computed,
  input,
} from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_SET = new Set<ButtonVariant>(['primary', 'secondary', 'ghost', 'danger']);
const SIZE_SET = new Set<ButtonSize>(['sm', 'md', 'lg']);

@Component({
  selector: 'button[appButton]',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  @HostBinding('class.btn') protected readonly baseClass = true;

  @HostBinding('class.btn--primary')
  protected get isPrimary(): boolean {
    return this.resolvedVariant() === 'primary';
  }

  @HostBinding('class.btn--secondary')
  protected get isSecondary(): boolean {
    return this.resolvedVariant() === 'secondary';
  }

  @HostBinding('class.btn--ghost')
  protected get isGhost(): boolean {
    return this.resolvedVariant() === 'ghost';
  }

  @HostBinding('class.btn--danger')
  protected get isDanger(): boolean {
    return this.resolvedVariant() === 'danger';
  }

  @HostBinding('class.btn--sm')
  protected get isSmall(): boolean {
    return this.resolvedSize() === 'sm';
  }

  @HostBinding('class.btn--lg')
  protected get isLarge(): boolean {
    return this.resolvedSize() === 'lg';
  }

  @HostBinding('class.btn--icon')
  protected get isIconOnly(): boolean {
    return this.iconOnly();
  }

  @HostBinding('class.btn--block')
  protected get isFullWidth(): boolean {
    return this.fullWidth();
  }

  @HostBinding('class.btn--loading')
  protected get isLoadingClass(): boolean {
    return this.loading();
  }

  @HostBinding('attr.aria-busy')
  protected get ariaBusy(): 'true' | null {
    return this.loading() ? 'true' : null;
  }

  @HostBinding('attr.data-variant')
  protected get dataVariant(): ButtonVariant {
    return this.resolvedVariant();
  }

  @HostBinding('attr.data-size')
  protected get dataSize(): ButtonSize {
    return this.resolvedSize();
  }
}
