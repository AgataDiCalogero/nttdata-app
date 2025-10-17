import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Trash2, Pencil, Plus } from 'lucide-angular';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { UserFiltersComponent } from './user-filters/user-filters.component';
import { UserListComponent } from './user-list/user-list.component';
import type { User } from '@/app/shared/models';
import type { SortField } from './store/users.service';
import { provideUsersService, injectUsersService } from './store/users.inject';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    ButtonComponent,
    AlertComponent,
    UserFiltersComponent,
    UserListComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUsersService()],
})
export class Users {
  public readonly usersService = injectUsersService();
  private readonly router = inject(Router);

  readonly Trash2 = Trash2;
  readonly Pencil = Pencil;
  readonly Plus = Plus;

  // Expose service signals
  readonly loading = this.usersService.loading;
  readonly error = this.usersService.error;
  readonly deletingId = this.usersService.deletingId;
  readonly displayed = this.usersService.displayed;

  sortDir(field: SortField): number {
    const sort = this.usersService.sortState();
    return sort.field === field ? sort.dir : 0;
  }

  currentPage(): { page: number; per_page: number } {
    return this.usersService.pageState();
  }

  totalPages(total: number): number {
    const perPage = this.usersService.pageState().per_page || 1;
    return Math.max(1, Math.ceil(total / perPage));
  }

  isChildRouteActive(): boolean {
    return this.router.url !== '/users';
  }

  goToDetail(userId: number): void {
    this.router.navigate(['/users', userId]).catch(() => {});
  }

  onSearch(value: string): void {
    this.usersService.onSearch(value);
  }

  toggleSort(field: SortField): void {
    this.usersService.toggleSort(field);
  }

  ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    const { field: currentField, dir } = this.usersService.sortState();
    if (currentField !== field) {
      return 'none';
    }

    return dir === 1 ? 'ascending' : 'descending';
  }

  sortIndicator(field: SortField): 'asc' | 'desc' | null {
    const { field: currentField, dir } = this.usersService.sortState();
    if (currentField !== field) {
      return null;
    }

    return dir === 1 ? 'asc' : 'desc';
  }

  sortButtonLabel(field: SortField, label: string): string {
    const { field: currentField, dir } = this.usersService.sortState();
    const nextDir = currentField === field && dir === 1 ? 'descending' : 'ascending';
    return `Sort ${label} ${nextDir}`;
  }

  setPage(page: number, per_page: number, pushUrl = true): void {
    this.usersService.setPage(page, per_page, pushUrl);
  }

  trackById(_idx: number, user: User): number {
    return user.id;
  }

  openNewUserModal(): void {
    this.usersService.openNewUserModal();
  }

  openEditUserModal(userId: number): void {
    this.usersService.openEditUserModal(userId);
  }

  onDelete(user: User): void {
    this.usersService.onDelete(user);
  }

  clearError(): void {
    // Since error is managed by the service, we might need to reload or handle differently
    // For now, just reload
    this.usersService.loadUsers();
  }
}
