import { AppError } from '../../middleware/errorHandler';
import { AuthorsRepository } from './authors.repository';
import type { createAuthorInput, updateAuthorInput } from './authors.schema';
import type { Author, PaginatedAuthors } from './authors.types';

export class AuthorsService {
  private repository: AuthorsRepository;

  constructor() {
    this.repository = new AuthorsRepository();
  }

  async createAuthor(data: createAuthorInput): Promise<Author> {
    const author = await this.repository.create(data);
    return author;
  }

  async getAuthorById(id: number): Promise<Author> {
    const author = await this.repository.findById(id);
    if (!author) throw new AppError(404, 'Author not found');

    return author;
  }

  async updateAuthor(id: number, data: updateAuthorInput): Promise<Author> {
    const updatedAuthor = await this.repository.update(id, data);
    if (!updatedAuthor) throw new AppError(404, 'Author not found');

    return updatedAuthor;
  }

  async deleteAuthor(id: number): Promise<void> {
    const author = await this.repository.findById(id);
    if (!author) throw new AppError(404, 'Author not found');

    const hasBooks = await this.repository.checkHasBooks(id);
    if (hasBooks) throw new AppError(400, 'Cannot delete author with associated books');

    await this.repository.delete(id);
  }

  async listAuthors(page: number, limit: number): Promise<PaginatedAuthors> {
    const { authors, total } = await this.repository.list(page, limit);

    return {
      data: authors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}