import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { User } from '@/app/shared/models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
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
  imports: [CommonModule, ButtonComponent, LucideAngularModule],
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

  @Input() items: User[] = [];

  @Output() readonly view = new EventEmitter<number>();
  @Output() readonly edit = new EventEmitter<number>();
  @Output() readonly delete = new EventEmitter<User>();

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

  genderOf(user: User): string | undefined {
    return (user as unknown as { gender?: string }).gender || undefined;
  }
}
