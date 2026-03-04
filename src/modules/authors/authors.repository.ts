import { pool } from '../../config/db';
import type { createAuthorInput, updateAuthorInput } from './authors.schema';
import type { Author } from './authors.types';

export class AuthorsRepository {
  async create(data: createAuthorInput): Promise<Author> {
    const result = await pool.query<Author>(
      'INSERT INTO authors (name) VALUES ($1) RETURNING *',
      [data.name]
    );

    return result.rows[0]!;
  }

  async findById(id: number): Promise<Author | null> {
    const result = await pool.query<Author>(
      'SELECT * FROM authors WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<Author | null> {
    const result = await pool.query<Author>(
      'SELECT * FROM authors WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  async update(id: number, data: updateAuthorInput): Promise<Author | null> {
    const result = await pool.query<Author>(
      'UPDATE authors SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [data.name, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<Author | null> {
    const result = await pool.query<Author>(
      'DELETE FROM authors WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] ?? null;
  }

  async list(page: number, limit: number): Promise<{ authors: Author[]; total: number }> {
    const offset = (page - 1) * limit;

    const [authorsResult, countResult] = await Promise.all([
      pool.query<Author>(
        'SELECT * FROM authors ORDER BY name ASC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      pool.query<{ count: string }>('SELECT COUNT(*) FROM authors')
    ]);

    return {
      authors: authorsResult.rows,
      total: parseInt(countResult.rows[0]!.count, 10)
    };
  }

  async checkHasBooks(id: number): Promise<boolean> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM book_authors WHERE author_id = $1',
      [id]
    );
    return parseInt(result.rows[0]!.count, 10) > 0;
  }
}
