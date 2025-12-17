import type { CreateUser, UpdateUser, User } from '@/app/shared/models/user';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  gender?: string | null;
  status: 'active' | 'inactive';
}

export type CreateUserDto = Omit<UserDto, 'id'>;
export type UpdateUserDto = Partial<CreateUserDto>;

export const mapUserDto = (dto: UserDto): User => ({
  id: dto.id,
  name: dto.name.trim(),
  email: dto.email.trim(),
  gender: dto.gender ?? undefined,
  status: dto.status,
});

export const mapUsersDto = (list: UserDto[] | null | undefined): User[] =>
  (list ?? []).map((dto) => mapUserDto(dto));

export const mapCreateUserToDto = (payload: CreateUser): CreateUserDto => ({
  name: payload.name.trim(),
  email: payload.email.trim().toLowerCase(),
  gender: payload.gender ?? 'male',
  status: payload.status ?? 'active',
});

export const mapUpdateUserToDto = (payload: UpdateUser): UpdateUserDto => ({
  ...payload,
  name: typeof payload.name === 'string' ? payload.name.trim() : undefined,
  email: typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : undefined,
});
