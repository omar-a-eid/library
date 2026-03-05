import { AppError } from '../../middleware/errorHandler';
import { BooksService } from '../books/books.service';
import { UsersService } from '../users/users.service';
import { BorrowingsRepository } from './borrowings.repository';
import type { CheckoutBookInput } from './borrowings.schema';
import type { BorrowingWithDetails, BorrowState, PaginatedBorrowings } from './borrowings.types';

export class BorrowingsService {
  private repository: BorrowingsRepository;
  private usersService: UsersService;
  private booksService: BooksService;

  constructor() {
    this.repository = new BorrowingsRepository();
    this.usersService = new UsersService();
    this.booksService = new BooksService();
  }

  async checkoutBook(data: CheckoutBookInput): Promise<BorrowingWithDetails> {
    await this.usersService.getUserById(data.borrower_id);

    const book = await this.booksService.getBookById(data.book_id);

    if (book.available_qty <= 0) {
      throw new AppError(400, 'Book is not available for checkout');
    }

    const activeBorrowing = await this.repository.getActiveBorrowingByBookId(data.book_id);
    if (activeBorrowing) {
      throw new AppError(400, 'Book is already checked out');
    }

    const dueDays = data.due_days ?? 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const borrowing = await this.repository.checkoutBookWithTransaction(data, dueDate);

    const result = await this.repository.findById(borrowing.id);
    if (!result) throw new AppError(500, 'Failed to create borrowing');

    return result;
  }

  async returnBook(id: number): Promise<BorrowingWithDetails> {
    const borrowing = await this.repository.findById(id);
    if (!borrowing) {
      throw new AppError(404, 'Borrowing transaction not found');
    }

    if (borrowing.state === 'returned') {
      throw new AppError(400, 'Book has already been returned');
    }

    const returnDate = new Date();
    const returned = await this.repository.returnBookWithTransaction(id, returnDate, borrowing.book_id);
    if (!returned) {
      throw new AppError(404, 'Failed to return book');
    }

    const result = await this.repository.findById(id);
    if (!result) throw new AppError(500, 'Failed to retrieve borrowing');

    return result;
  }

  async getBorrowingById(id: number): Promise<BorrowingWithDetails> {
    const borrowing = await this.repository.findById(id);
    if (!borrowing) {
      throw new AppError(404, 'Borrowing transaction not found');
    }
    return borrowing;
  }

  async listBorrowings(
    page: number,
    limit: number,
    borrowerId?: number,
    state?: BorrowState
  ): Promise<PaginatedBorrowings> {
    // Update overdue books before listing
    await this.repository.updateOverdueBooks();

    const { borrowings, total } = await this.repository.list(page, limit, borrowerId, state);

    return {
      data: borrowings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getMyCurrentBooks(borrowerId: number, page: number, limit: number): Promise<PaginatedBorrowings> {
    await this.usersService.getUserById(borrowerId);

    // Update overdue books before listing
    await this.repository.updateOverdueBooks();

    const { borrowings, total } = await this.repository.getMyCurrentBooks(borrowerId, page, limit);

    return {
      data: borrowings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getOverdueBooks(page: number, limit: number): Promise<PaginatedBorrowings> {
    // Update overdue books before listing
    await this.repository.updateOverdueBooks();

    return this.listBorrowings(page, limit, undefined, 'overdue');
  }

  async exportBorrowingsByPeriod(startDate: Date, endDate: Date, format: 'csv' | 'xlsx'): Promise<{ buffer: Buffer | string; contentType: string; filename: string }> {
    const { ExportContext } = await import('../../utils/export/ExportContext');

    await this.repository.updateOverdueBooks();
    const borrowings = await this.repository.getBorrowingsByPeriod(startDate, endDate);

    const exportData = borrowings.map(b => ({
      id: b.id,
      borrower_name: b.borrower_name,
      borrower_email: b.borrower_email,
      book_title: b.book_title,
      book_isbn: b.book_isbn,
      state: b.state,
      checkout_date: b.checkout_date,
      due_date: b.due_date,
      return_date: b.return_date || 'Not returned'
    }));

    const exporter = new ExportContext(format);
    const { buffer, contentType, extension } = await exporter.exportData(exportData);

    const filename = `borrowings_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.${extension}`;

    return { buffer, contentType, filename };
  }

  async exportOverdueBorrowingsByPeriod(startDate: Date, endDate: Date, format: 'csv' | 'xlsx'): Promise<{ buffer: Buffer | string; contentType: string; filename: string }> {
    const { ExportContext } = await import('../../utils/export/ExportContext');

    await this.repository.updateOverdueBooks();
    const borrowings = await this.repository.getOverdueBorrowingsByPeriod(startDate, endDate);

    const exportData = borrowings.map(b => ({
      id: b.id,
      borrower_name: b.borrower_name,
      borrower_email: b.borrower_email,
      book_title: b.book_title,
      book_isbn: b.book_isbn,
      checkout_date: b.checkout_date,
      due_date: b.due_date,
      days_overdue: Math.floor((new Date().getTime() - new Date(b.due_date).getTime()) / (1000 * 60 * 60 * 24))
    }));

    const exporter = new ExportContext(format);
    const { buffer, contentType, extension } = await exporter.exportData(exportData);

    const filename = `overdue_borrowings_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.${extension}`;

    return { buffer, contentType, filename };
  }
}
