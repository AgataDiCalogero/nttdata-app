import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  ViewContainerRef,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-overflow-reveal-popover',
  standalone: true,
  template: `<div class="overflow-reveal-popover">{{ text }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverflowRevealPopoverComponent {
  @Input() text = '';
}

@Directive({
  selector: '[appOverflowReveal]',
  standalone: true,
})
export class OverflowRevealDirective implements AfterViewInit, OnDestroy {
  @Input('appOverflowReveal') revealText?: string;
  @Input() appOverflowRevealDisabled = false;

  private static active: OverflowRevealDirective | null = null;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly platformId = inject(PLATFORM_ID);

  private overlayRef: OverlayRef | null = null;
  private isOpen = false;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const host = this.el.nativeElement;
    host.classList.add('overflow-reveal-target');
    if (!this.isInteractive(host) && !host.hasAttribute('tabindex')) {
      this.renderer.setAttribute(host, 'tabindex', '0');
    }
    if (!this.isInteractive(host) && !host.hasAttribute('role')) {
      this.renderer.setAttribute(host, 'role', 'button');
    }
  }

  ngOnDestroy(): void {
    this.close();
    this.disposeOverlay();
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.appOverflowRevealDisabled === true) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.appOverflowRevealDisabled === true) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
      return;
    }
    if (event.key === 'Escape') {
      this.close();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.close();
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
      return;
    }
    this.open();
  }

  private open(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.isOpen || !this.isTruncated()) {
      return;
    }
    const text = this.getRevealText();
    if (text.length === 0) {
      return;
    }

    if (OverflowRevealDirective.active !== null) {
      OverflowRevealDirective.active.close();
    }
    OverflowRevealDirective.active = this;

    this.ensureOverlay();
    if (this.overlayRef === null) {
      return;
    }

    const portal = new ComponentPortal(OverflowRevealPopoverComponent, this.viewContainerRef);
    const componentRef = this.overlayRef.attach(portal);
    componentRef.instance.text = text;
    componentRef.changeDetectorRef.detectChanges();

    this.isOpen = true;
    this.renderer.setAttribute(this.el.nativeElement, 'aria-expanded', 'true');
    this.focusHost();
  }

  private close(): void {
    if (this.isOpen === false) {
      return;
    }
    if (this.overlayRef?.hasAttached() === true) {
      this.overlayRef.detach();
    }
    this.syncClosedState();
  }

  private syncClosedState(): void {
    this.isOpen = false;
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-expanded');
    if (OverflowRevealDirective.active === this) {
      OverflowRevealDirective.active = null;
    }
  }

  private ensureOverlay(): void {
    if (this.overlayRef !== null) {
      return;
    }
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.el)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'overflow-reveal-panel',
      hasBackdrop: true,
      backdropClass: 'overflow-reveal-backdrop',
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.detachments().subscribe(() => this.syncClosedState());
  }

  private disposeOverlay(): void {
    if (this.overlayRef === null) {
      return;
    }
    this.overlayRef.dispose();
    this.overlayRef = null;
  }

  private focusHost(): void {
    const host = this.el.nativeElement;
    try {
      host.focus({ preventScroll: true });
    } catch {
      // ignore focus failures
    }
  }

  private isTruncated(): boolean {
    const host = this.el.nativeElement;
    if (host.clientWidth === 0) {
      return false;
    }
    return host.scrollWidth > host.clientWidth + 1 || host.scrollHeight > host.clientHeight + 1;
  }

  private getRevealText(): string {
    const raw =
      typeof this.revealText === 'string' ? this.revealText : this.el.nativeElement.textContent;
    return (raw ?? '').trim();
  }

  private isInteractive(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) return true;
    return element.hasAttribute('tabindex');
  }
}
