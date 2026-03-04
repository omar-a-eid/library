import { pagination } from '../../types';

export type UserRole = 'admin' | 'borrower';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  registered_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  registered_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedUsers {
  data: UserResponse[];
  pagination: pagination;
}
