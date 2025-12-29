import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { StatusBadgeComponent } from '@app/shared/ui/status-badge/status-badge.component';

import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { User } from '@/app/shared/models/user';
import { DeviceTypeService } from '@/app/shared/services/device-type/device-type.service';

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
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  readonly items = input([] as User[]);
  private readonly _deviceType = inject(DeviceTypeService);
  private readonly i18n = inject(I18nService);

  protected readonly isMobile = this._deviceType.isMobile;

  readonly edit = output<number>();
  readonly delete = output<User>();
  readonly statusChange = output<{ user: User; status: 'active' | 'inactive' }>();

  trackById(_index: number, item: User): number {
    return item.id;
  }

  onEdit(user: User, event?: Event): void {
    event?.stopPropagation();
    this.edit.emit(user.id);
  }

  onDelete(user: User, event?: Event): void {
    event?.stopPropagation();
    this.delete.emit(user);
  }

  onStatusChange(user: User, status: 'active' | 'inactive'): void {
    this.statusChange.emit({ user, status });
  }

  initials(user?: User): string {
    const name = user && typeof user.name === 'string' ? user.name.trim() : '';
    if (!name) return '#';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return ((parts[0][0] || '') + (parts[1][0] || '')).toUpperCase();
  }

  getGenderLabel(gender?: string): string {
    const normalized = gender?.trim();
    if (normalized == null || normalized === '') {
      return this.i18n.translate('common.gender.unspecified');
    }
    const genderKey = normalized.toLowerCase();
    if (genderKey === 'male' || genderKey === 'female') {
      return this.i18n.translate(`common.gender.${genderKey}`);
    }
    return this.i18n.translate('common.gender.unspecified');
  }
}
