import { CommonModule, ViewportScroller, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { PaginationComponent } from '@app/shared/ui/pagination/pagination.component';

import type { User } from '@/app/shared/models/user';

import { provideUsersService, injectUsersService } from './store/users.inject';
import type { SortField } from './store/users.service';
import { UserFiltersComponent } from './user-filters/user-filters.component';
import { UserListSkeletonComponent } from './user-list/user-list-skeleton.component';
import { UserListComponent } from './user-list/user-list.component';
import { UsersUiService } from './user-services/users-ui.service';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
    LucideAngularModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ButtonComponent,
    UserFiltersComponent,
    UserListComponent,
    UserListSkeletonComponent,
    PaginationComponent,
    AlertComponent,
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
  private readonly i18n = inject(I18nService);
  private readonly viewport = inject(ViewportScroller);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly numberFormatter = new Intl.NumberFormat('en-US');

  readonly loading = this.usersService.loading;
  readonly error = this.usersService.error;
  readonly deletingId = this.usersService.deletingId;
  readonly users = this.usersService.users;
  readonly pagination = this.usersService.pagination;
  readonly page = this.usersService.page;
  readonly perPage = this.usersService.perPage;
  readonly perPageOptions = this.usersService.perPageOptions;

  constructor() {
    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      this.page();
      this.viewport.scrollToPosition([0, 0]);
    });
  }

  readonly visibleUsersCount = computed(() => this.users().length);
  readonly totalUsersCount = computed(() => this.pagination()?.total ?? this.visibleUsersCount());
  readonly usersSummary = computed(() => {
    if (this.loading()) {
      return '';
    }
    const visible = this.visibleUsersCount();
    const total = this.totalUsersCount();
    if (total === 0) {
      return '';
    }
    const formattedVisible = this.numberFormatter.format(visible);
    const formattedTotal = this.numberFormatter.format(total);
    if (visible === total) {
      const key = total === 1 ? 'users.summary.single' : 'users.summary.all';
      return this.i18n.translate(key, { total: formattedTotal });
    }
    return this.i18n.translate('users.summary.partial', {
      visible: formattedVisible,
      total: formattedTotal,
    });
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
    return this.i18n.translate('users.sortButtonLabel', { label, direction: nextDir });
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

  onResetFilters(): void {
    this.usersService.resetFilters();
  }
}
