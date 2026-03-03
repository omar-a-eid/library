import { pagination } from '../../types';

export interface Author {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedAuthors {
  data: Author[];
  pagination: pagination;
}