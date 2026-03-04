import { pool } from '../../config/db';
import { ShelfLocationsRepository } from '../shelf-locations/shelf-locations.repository';
import type { CreateBookInput } from './books.schema';
import type { Book, BookWithDetails, SearchBooksParams } from './books.types';

export class BooksRepository {
  private shelfLocationsRepository: ShelfLocationsRepository;

  constructor() {
    this.shelfLocationsRepository = new ShelfLocationsRepository();
  }

  private readonly BASE_BOOK_QUERY = `
    SELECT
      b.id, b.title, b.isbn, b.available_qty, b.created_at, b.updated_at,
      row_to_json(sl.*) as shelf_location,
      COALESCE(
        json_agg(
          json_build_object('id', a.id, 'name', a.name, 'created_at', a.created_at, 'updated_at', a.updated_at)
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
      ) as authors
    FROM books b
    LEFT JOIN shelf_locations sl ON b.shelf_location_id = sl.id
    LEFT JOIN book_authors ba ON b.id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.id
  `;

  private mapToBookWithDetails(row: any): BookWithDetails {
    return {
      id: row.id,
      title: row.title,
      isbn: row.isbn,
      available_qty: row.available_qty,
      created_at: row.created_at,
      updated_at: row.updated_at,
      authors: row.authors,
      shelf_location: row.shelf_location,
    };
  }

  async create(data: CreateBookInput): Promise<Book> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const shelfLocation = await this.shelfLocationsRepository.findOrCreateWithClient(client, data.shelf_location);

      const bookResult = await client.query<Book>(
        `INSERT INTO books (title, isbn, available_qty, shelf_location_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.title, data.isbn, data.available_qty, shelfLocation.id]
      );
      const book = bookResult.rows[0]!;

      if (data.author_ids.length > 0) {
        const placeholders = data.author_ids
          .map((_, index) => `($1, $${index + 2})`)
          .join(', ');

        await client.query(
          `INSERT INTO book_authors (book_id, author_id) VALUES ${placeholders}`,
          [book.id, ...data.author_ids]
        );
      }

      await client.query('COMMIT');
      return book;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    const result = await pool.query<Book>(
      'SELECT * FROM books WHERE isbn = $1',
      [isbn]
    );
    return result.rows[0] || null;
  }

  async addBookAuthors(bookId: number, authorIds: number[]): Promise<void> {
    if (authorIds.length === 0) return;

    const placeholders = authorIds
      .map((_, index) => `($1, $${index + 2})`)
      .join(', ');

    await pool.query(
      `INSERT INTO book_authors (book_id, author_id) VALUES ${placeholders}`,
      [bookId, ...authorIds]
    );
  }

  async updateBookAuthors(bookId: number, authorIds: number[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM book_authors WHERE book_id = $1', [bookId]);

      if (authorIds.length > 0) {
        const placeholders = authorIds
          .map((_, index) => `($1, $${index + 2})`)
          .join(', ');

        await client.query(
          `INSERT INTO book_authors (book_id, author_id) VALUES ${placeholders}`,
          [bookId, ...authorIds]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: number): Promise<BookWithDetails | null> {
    const result = await pool.query<any>(
      `${this.BASE_BOOK_QUERY} WHERE b.id = $1 GROUP BY b.id, sl.*`,
      [id]
    );

    if (!result.rows[0]) return null;
    return this.mapToBookWithDetails(result.rows[0]);
  }

  async update(id: number, data: Partial<CreateBookInput>, shelfLocationId?: number): Promise<Book> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) { updates.push(`title = $${paramCount++}`); values.push(data.title); }
    if (data.isbn !== undefined) { updates.push(`isbn = $${paramCount++}`); values.push(data.isbn); }
    if (data.available_qty !== undefined) { updates.push(`available_qty = $${paramCount++}`); values.push(data.available_qty); }
    if (shelfLocationId !== undefined) { updates.push(`shelf_location_id = $${paramCount++}`); values.push(shelfLocationId); }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query<Book>(
      `UPDATE books SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0]!;
  }

  async delete(id: number): Promise<Book | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query<Book>(
        'DELETE FROM books WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        return null;
      }

      const book = result.rows[0]!;

      // Clean up orphaned shelf location
      if (book.shelf_location_id) {
        const usageCheck = await client.query<{ count: string }>(
          'SELECT COUNT(*) FROM books WHERE shelf_location_id = $1',
          [book.shelf_location_id]
        );

        if (parseInt(usageCheck.rows[0]!.count, 10) === 0) {
          await client.query('DELETE FROM shelf_locations WHERE id = $1', [book.shelf_location_id]);
        }
      }

      await client.query('COMMIT');
      return book;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async list(page: number, limit: number): Promise<{ books: BookWithDetails[]; total: number }> {
    const offset = (page - 1) * limit;

    const [booksResult, countResult] = await Promise.all([
      pool.query<any>(
        `${this.BASE_BOOK_QUERY}
         GROUP BY b.id, sl.*
         ORDER BY b.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      pool.query<{ count: string }>('SELECT COUNT(*) FROM books'),
    ]);

    return {
      books: booksResult.rows.map(row => this.mapToBookWithDetails(row)),
      total: parseInt(countResult.rows[0]!.count, 10),
    };
  }

  async search(params: SearchBooksParams, page: number, limit: number): Promise<{ books: BookWithDetails[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.title) {
      const titleQuery = params.title
        .trim()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((term: string) => term.length > 0)
        .map((term: string) => `${term}:*`)
        .join(' & ');

      if (titleQuery) {
        conditions.push(`to_tsvector('english', b.title) @@ to_tsquery('english', $${paramIndex})`);
        values.push(titleQuery);
        paramIndex++;
      }
    }

    if (params.author) {
      const authorQuery = params.author
        .trim()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((term: string) => term.length > 0)
        .map((term: string) => `${term}:*`)
        .join(' & ');

      if (authorQuery) {
        conditions.push(`EXISTS (
          SELECT 1 FROM book_authors ba2
          JOIN authors a2 ON ba2.author_id = a2.id
          WHERE ba2.book_id = b.id 
            AND to_tsvector('english', a2.name) @@ to_tsquery('english', $${paramIndex})
        )`);
        values.push(authorQuery);
        paramIndex++;
      }
    }

    if (params.isbn) {
      conditions.push(`b.isbn ILIKE $${paramIndex}`);
      values.push(`%${params.isbn.trim()}%`);
      paramIndex++;
    }

    if (conditions.length === 0) {
      return { books: [], total: 0 };
    }

    const whereClause = conditions.join(' AND ');
    values.push(limit, offset);

    const [booksResult, countResult] = await Promise.all([
      pool.query<any>(
        `SELECT 
           b.id, b.title, b.isbn, b.available_qty, b.created_at, b.updated_at,
           row_to_json(sl.*) as shelf_location,
           COALESCE(
             json_agg(
               json_build_object('id', a.id, 'name', a.name, 'created_at', a.created_at, 'updated_at', a.updated_at)
             ) FILTER (WHERE a.id IS NOT NULL),
             '[]'
           ) as authors
         FROM books b
         LEFT JOIN shelf_locations sl ON b.shelf_location_id = sl.id
         LEFT JOIN book_authors ba ON b.id = ba.book_id
         LEFT JOIN authors a ON ba.author_id = a.id
         WHERE ${whereClause}
         GROUP BY b.id, sl.*
         ORDER BY b.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT b.id)
         FROM books b
         LEFT JOIN book_authors ba ON b.id = ba.book_id
         LEFT JOIN authors a ON ba.author_id = a.id
         WHERE ${whereClause}`,
        values.slice(0, -2)
      ),
    ]);

    return {
      books: booksResult.rows.map(row => this.mapToBookWithDetails(row)),
      total: parseInt(countResult.rows[0]!.count, 10),
    };
  }
}