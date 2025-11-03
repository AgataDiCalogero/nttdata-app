import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { User } from '@/app/shared/models/user';
import { MatCardModule } from '@angular/material/card';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '@app/shared/ui/status-badge/status-badge.component';
import { DeviceTypeService } from '@/app/shared/services/device-type.service';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    ButtonComponent,
    MatIconModule,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  readonly items = input([] as User[]);
  private readonly _deviceType = inject(DeviceTypeService);

  // signal used by the template to switch which delete button is rendered
  protected readonly isMobile = this._deviceType.isMobile;

  readonly edit = output<number>();
  readonly delete = output<User>();

  trackById(_index: number, item: User): number {
    return item.id;
  }

  constructor() {
    // const bo = inject(BreakpointObserver);
    // const destroyRef = inject(DestroyRef);
    // bo.observe('(max-width: 40rem)')
    //   .pipe(takeUntilDestroyed(destroyRef))
    //   .subscribe((s) => this.isMobile.set(Boolean(s.matches)));
  }

  onEdit(user: User, event?: Event): void {
    event?.stopPropagation();
    this.edit.emit(user.id);
  }

  onDelete(user: User, event?: Event): void {
    event?.stopPropagation();
    this.delete.emit(user);
  }

  initials(user?: User): string {
    const name = user && typeof user.name === 'string' ? user.name.trim() : '';
    if (!name) return '#';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return ((parts[0][0] || '') + (parts[1][0] || '')).toUpperCase();
  }
}
