import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule } from 'lucide-angular';
import { UserFiltersComponent } from './user-filters/user-filters.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserListSkeletonComponent } from './user-list/user-list-skeleton.component';
import { PaginationComponent } from '@app/shared/ui/pagination/pagination.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import type { User } from '@/app/shared/models/user';
import type { SortField } from './store/users.service';
import { provideUsersService, injectUsersService } from './store/users.inject';
import { UsersUiService } from './users-ui.service';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    LucideAngularModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ButtonComponent,
    UserFiltersComponent,
    UserListComponent,
    UserListSkeletonComponent,
    PaginationComponent,
    TranslatePipe,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideUsersService(), UsersUiService],
})
export class Users {
  public readonly usersService = injectUsersService();
  private readonly usersUi = inject(UsersUiService);
  private readonly router = inject(Router);
  private readonly numberFormatter = new Intl.NumberFormat('en-US');

  readonly loading = this.usersService.loading;
  readonly error = this.usersService.error;
  readonly deletingId = this.usersService.deletingId;
  readonly users = this.usersService.users;
  readonly pagination = this.usersService.pagination;
  readonly page = this.usersService.page;
  readonly perPage = this.usersService.perPage;
  readonly perPageOptions = this.usersService.perPageOptions;
  readonly visibleUsersCount = computed(() => this.users().length);
  readonly totalUsersCount = computed(() => this.pagination()?.total ?? this.visibleUsersCount());
  readonly usersSummary = computed(() => {
    if (this.loading()) {
      return 'Loading users...';
    }
    const visible = this.visibleUsersCount();
    const total = this.totalUsersCount();
    if (total === 0) {
      return 'No users found';
    }
    const noun = total === 1 ? 'user' : 'users';
    if (visible === total) {
      return `${this.numberFormatter.format(total)} ${noun}`;
    }
    return `Showing ${this.numberFormatter.format(visible)} of ${this.numberFormatter.format(total)} users`;
  });

  perPageOptionsMutable(): number[] {
    return [...this.perPageOptions()];
  }

  sortDir(field: SortField): number {
    const sort = this.usersService.sortState();
    return sort.field === field ? sort.dir : 0;
  }

  isChildRouteActive(): boolean {
    const [pathWithoutQuery] = this.router.url.split('?');
    const basePath = pathWithoutQuery.split('#')[0];
    return basePath !== '/users';
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

  onPageChange(page: number): void {
    this.usersService.setPage(page);
  }

  onPerPageChange(perPage: number): void {
    this.usersService.setPerPage(perPage);
  }

  trackById(_idx: number, user: User): number {
    return user.id;
  }

  openNewUserModal(): void {
    this.usersUi.openCreateUserModal();
  }

  openEditUserModal(userId: number): void {
    this.usersUi.openEditUserModal(userId);
  }

  onDelete(user: User): void {
    this.usersUi.confirmDelete(user);
  }

  onStatusChange({ user, status }: { user: User; status: 'active' | 'inactive' }): void {
    this.usersService.updateStatus(user.id, status);
  }

  clearError(): void {
    this.usersService.loadUsers();
  }
}
