import { Injectable } from '@angular/core';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';

@Injectable({ providedIn: 'root' })
export class NavMenuService {
  private toolbarTrigger: MatMenuTrigger | null = null;
  private floatingTrigger: MatMenuTrigger | null = null;
  private menuRef: MatMenu | null = null;

  /** Register a trigger. Kind defaults to 'toolbar'. */
  register(trigger: MatMenuTrigger | null, kind: 'toolbar' | 'floating' = 'toolbar'): void {
    if (kind === 'floating') this.floatingTrigger = trigger;
    else this.toolbarTrigger = trigger;
  }

  setMenu(menu: MatMenu | null): void {
    this.menuRef = menu;
  }

  open(position?: 'above' | 'below', kind?: 'toolbar' | 'floating'): void {
    const t =
      kind === 'floating'
        ? (this.floatingTrigger ?? this.toolbarTrigger)
        : (this.toolbarTrigger ?? this.floatingTrigger);
    if (!t) return;
    if (position && t.menu) t.menu.yPosition = position;
    t.openMenu();
  }

  close(kind?: 'toolbar' | 'floating'): void {
    const t =
      kind === 'floating'
        ? (this.floatingTrigger ?? this.toolbarTrigger)
        : (this.toolbarTrigger ?? this.floatingTrigger);
    t?.closeMenu();
  }

  toggle(position?: 'above' | 'below', kind?: 'toolbar' | 'floating'): void {
    const t =
      kind === 'floating'
        ? (this.floatingTrigger ?? this.toolbarTrigger)
        : (this.toolbarTrigger ?? this.floatingTrigger);
    if (!t) return;
    if (position && t.menu) t.menu.yPosition = position;
    if (t.menuOpen) t.closeMenu();
    else t.openMenu();
  }
}
