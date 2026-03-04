import { AppError } from '../../middleware/errorHandler';
import { AuthorsService } from '../authors/authors.service';
import { ShelfLocationsService } from '../shelf-locations/shelf-locations.service';
import { BooksRepository } from './books.repository';
import type { CreateBookInput, UpdateBookInput } from './books.schema';
import type { BookWithDetails, PaginatedBooks, SearchBooksParams } from './books.types';

export class BooksService {
  private repository: BooksRepository;
  private authorsService: AuthorsService;
  private shelfLocationsService: ShelfLocationsService;

  constructor() {
    this.repository = new BooksRepository();
    this.authorsService = new AuthorsService();
    this.shelfLocationsService = new ShelfLocationsService();
  }

  private async validateAuthors(authorIds: number[]): Promise<void> {
    if (authorIds.length === 0) return;

    const foundAuthors = await this.authorsService.findByIds(authorIds);

    if (foundAuthors.length !== authorIds.length) {
      const foundIds = new Set(foundAuthors.map(a => a.id));
      const missingIds = authorIds.filter(id => !foundIds.has(id));
      throw new AppError(400, `Authors not found: ${missingIds.join(', ')}`);
    }
  }

  async createBook(data: CreateBookInput): Promise<BookWithDetails> {
    await this.validateAuthors(data.author_ids);

    const existingBook = await this.repository.findByIsbn(data.isbn);
    if (existingBook) {
      throw new AppError(409, 'Book with this ISBN already exists');
    }

    const book = await this.repository.create(data);

    return this.repository.findById(book.id) as Promise<BookWithDetails>;
  }

  async getBookById(id: number): Promise<BookWithDetails> {
    const book = await this.repository.findById(id);
    if (!book) {
      throw new AppError(404, 'Book not found');
    }
    return book;
  }

  async updateBook(id: number, data: UpdateBookInput): Promise<BookWithDetails> {
    const { author_ids, shelf_location, ...bookFields } = data;

    const hasChanges = Object.values(bookFields).some(v => v !== undefined)
      || author_ids !== undefined
      || shelf_location !== undefined;

    if (!hasChanges) throw new AppError(400, 'No fields to update');

    const existingBook = await this.repository.findById(id);
    if (!existingBook) throw new AppError(404, 'Book not found');

    if (author_ids !== undefined) {
      await this.validateAuthors(author_ids);
    }

    if (bookFields.isbn && bookFields.isbn !== existingBook.isbn) {
      const bookWithIsbn = await this.repository.findByIsbn(bookFields.isbn);
      if (bookWithIsbn && bookWithIsbn.id !== id) {
        throw new AppError(409, 'Book with this ISBN already exists');
      }
    }

    let shelfLocationId: number | undefined;
    if (shelf_location) {
      const shelfLocation = await this.shelfLocationsService.findOrCreateShelfLocation(shelf_location);
      shelfLocationId = shelfLocation.id;
    }

    const updatedBook = await this.repository.update(id, bookFields as Partial<CreateBookInput>, shelfLocationId);

    if (author_ids !== undefined) {
      await this.repository.updateBookAuthors(id, author_ids);
    }

    return this.repository.findById(updatedBook.id) as Promise<BookWithDetails>;
  }

  async deleteBook(id: number): Promise<BookWithDetails> {
    const book = await this.repository.findById(id);
    if (!book) {
      throw new AppError(404, 'Book not found');
    }

    await this.repository.delete(id);
    return book;
  }

  async listBooks(page: number, limit: number): Promise<PaginatedBooks> {
    const { books, total } = await this.repository.list(page, limit);

    return {
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async searchBooks(params: SearchBooksParams, page: number, limit: number): Promise<PaginatedBooks> {
    const hasSearchCriteria = params.title || params.author || params.isbn;

    if (!hasSearchCriteria) {
      return this.listBooks(page, limit);
    }

    const { books, total } = await this.repository.search(params, page, limit);

    return {
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
