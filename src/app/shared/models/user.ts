export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  gender?: string;
  status: UserStatus;
}

export type CreateUser = Omit<User, 'id' | 'status'> & { status?: UserStatus };
export type UpdateUser = Partial<CreateUser>;
