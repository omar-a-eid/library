import { pagination } from '../../types';
import type { Author } from '../authors/authors.types';
import type { ShelfLocation } from '../shelf-locations/shelf-locations.types';

export interface Book {
  id: number;
  title: string;
  shelf_location_id: number | null;
  isbn: string;
  available_qty: number;
  created_at: Date;
  updated_at: Date;
}

export interface BookAuthor {
  book_id: number;
  author_id: number;
}

export interface SearchBooksParams {
  title?: string;
  author?: string;
  isbn?: string;
}

export interface BookWithDetails extends Omit<Book, 'shelf_location_id'> {
  authors: Author[];
  shelf_location?: ShelfLocation | null;
}

export interface PaginatedBooks {
  data: BookWithDetails[];
  pagination: pagination;
}
