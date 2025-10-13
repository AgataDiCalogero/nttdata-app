import { ChangeDetectionStrategy, Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trash2, Pencil } from 'lucide-angular';
import type { User } from '@/app/shared/models';

@Component({
  standalone: true,
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  @Input() items: User[] = [];
  @Output() readonly edit = new EventEmitter<number>();
  @Output() readonly delete = new EventEmitter<User>();

  trackById(_idx: number, item: User): number {
    return item.id;
  }
}
