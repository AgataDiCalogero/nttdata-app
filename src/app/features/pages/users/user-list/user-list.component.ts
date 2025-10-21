import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { User } from '@/app/shared/models';
import { ButtonComponent } from '@/app/shared/ui/button/button.component';
import {
  LucideAngularModule,
  Eye,
  Pencil,
  Trash2,
  Check,
  X,
  Mail,
  User as UserIcon,
} from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  readonly Eye = Eye;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Check = Check;
  readonly X = X;
  readonly Mail = Mail;
  readonly UserIcon = UserIcon;

  readonly items = input([] as User[]);

  readonly view = output<number>();
  readonly edit = output<number>();
  readonly delete = output<User>();

  trackById(_index: number, item: User): number {
    return item.id;
  }

  onView(user: User): void {
    this.view.emit(user.id);
  }

  onEdit(user: User, event: Event): void {
    event.stopPropagation();
    this.edit.emit(user.id);
  }

  onDelete(user: User, event: Event): void {
    event.stopPropagation();
    this.delete.emit(user);
  }

  /**
   * Compute up to two-character initials for the avatar display.
   */
  initials(user?: User): string {
    const name = user && typeof user.name === 'string' ? user.name.trim() : '';
    if (!name) return '#';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return ((parts[0][0] || '') + (parts[1][0] || '')).toUpperCase();
  }
}
