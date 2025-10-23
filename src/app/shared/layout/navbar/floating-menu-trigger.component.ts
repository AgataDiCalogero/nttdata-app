import {
  ChangeDetectionStrategy,
  Component,
  inject,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuTrigger } from '@angular/material/menu';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { NavMenuService } from './nav-menu.service';

@Component({
  standalone: true,
  selector: 'app-floating-menu-trigger',
  template: `
    <button
      appButton
      variant="secondary"
      class="floating-menu-trigger"
      type="button"
      aria-label="Open navigation"
      (click)="toggle()"
    >
      <mat-icon svgIcon="lucide:menu" aria-hidden="true"></mat-icon>
    </button>
  `,
  imports: [CommonModule, MatIconModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./floating-menu-trigger.component.scss'],
})
export class FloatingMenuTriggerComponent implements AfterViewInit {
  private readonly navMenu = inject(NavMenuService);
  @ViewChild(MatMenuTrigger) private readonly trigger?: MatMenuTrigger;

  ngAfterViewInit(): void {
    this.navMenu.register(this.trigger ?? null, 'floating');
  }

  toggle(): void {
    // Prefer the floating trigger to open the menu downward on mobile
    this.navMenu.toggle('below', 'floating');
  }
}
