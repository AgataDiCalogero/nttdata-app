import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import type { User } from '@/app/shared/models/user';
import { DeviceTypeService } from '@/app/shared/services/device-type/device-type.service';
import { iconProviders } from '@/testing/icon-mocks';

import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let deviceType: jasmine.SpyObj<DeviceTypeService>;

  const users: User[] = [
    { id: 1, name: 'Alice Wonderland', email: 'alice@test.com', status: 'active' } as User,
    { id: 2, name: 'Bob', email: 'bob@test.com', status: 'inactive' } as User,
  ];

  beforeEach(async () => {
    deviceType = jasmine.createSpyObj('DeviceTypeService', [], { isMobile: () => false });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, UserListComponent],
      providers: [{ provide: DeviceTypeService, useValue: deviceType }, ...iconProviders],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', users);
    fixture.detectChanges();
  });

  it('renderizza gli utenti e calcola le iniziali', () => {
    expect(component.items().length).toBe(2);
    expect(component.initials(users[0])).toBe('AW');
    expect(component.initials({ name: 'Bob' } as User)).toBe('BO');
  });

  it('emette edit/delete/statusChange', () => {
    const editSpy = jasmine.createSpy('edit');
    const deleteSpy = jasmine.createSpy('delete');
    const statusSpy = jasmine.createSpy('status');
    component.edit.subscribe(editSpy);
    component.delete.subscribe(deleteSpy);
    component.statusChange.subscribe(statusSpy);

    component.onEdit(users[0]);
    component.onDelete(users[1]);
    component.onStatusChange(users[0], 'inactive');

    expect(editSpy).toHaveBeenCalledWith(1);
    expect(deleteSpy).toHaveBeenCalledWith(users[1]);
    expect(statusSpy).toHaveBeenCalledWith({ user: users[0], status: 'inactive' });
  });
});
