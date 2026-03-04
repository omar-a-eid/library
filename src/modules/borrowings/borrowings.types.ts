import { pagination } from '../../types';

export type BorrowState = 'checked_out' | 'returned' | 'overdue';

export interface BorrowingTransaction {
  id: number;
  borrower_id: number;
  book_id: number;
  state: BorrowState;
  checkout_date: Date;
  due_date: Date;
  return_date: Date | null;
}

export interface BorrowingWithDetails extends BorrowingTransaction {
  borrower_name: string;
  borrower_email: string;
  book_title: string;
  book_isbn: string;
}

export interface PaginatedBorrowings {
  data: BorrowingWithDetails[];
  pagination: pagination;
}
