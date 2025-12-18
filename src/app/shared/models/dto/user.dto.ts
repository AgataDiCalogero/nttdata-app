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

const safeTrim = (value?: string | null): string => (value ?? '').trim();
const safeLower = (value?: string | null): string => safeTrim(value).toLowerCase();

export const mapUserDto = (dto: UserDto): User => ({
  id: dto.id,
  name: safeTrim(dto.name),
  email: safeTrim(dto.email),
  gender: dto.gender ?? undefined,
  status: dto.status,
});

export const mapUsersDto = (list: UserDto[] | null | undefined): User[] =>
  (list ?? []).map((dto) => mapUserDto(dto));

export const mapCreateUserToDto = (payload: CreateUser): CreateUserDto => ({
  name: safeTrim(payload.name),
  email: safeLower(payload.email),
  gender: payload.gender ?? 'male',
  status: payload.status === undefined ? 'active' : payload.status,
});

export const mapUpdateUserToDto = (payload: UpdateUser): UpdateUserDto => ({
  ...payload,
  name: typeof payload.name === 'string' ? safeTrim(payload.name) : undefined,
  email: typeof payload.email === 'string' ? safeLower(payload.email) : undefined,
});
