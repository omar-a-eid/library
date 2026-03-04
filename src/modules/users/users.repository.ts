import { pool } from '../../config/db';
import type { createUserInput, updateUserInput } from './users.schema';
import type { User, UserRole } from './users.types';

export class UsersRepository {
  async create(data: createUserInput): Promise<User> {
    const result = await pool.query<User>(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.name, data.email, data.password, data.role || 'borrower']
    );

    return result.rows[0]!;
  }

  async findById(id: number): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async update(id: number, data: updateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.password !== undefined) {
      fields.push(`password = $${paramCount++}`);
      values.push(data.password);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(data.role);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await pool.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<User | null> {
    const result = await pool.query<User>(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] ?? null;;
  }

  async list(page: number, limit: number, role?: UserRole): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    let usersQuery = 'SELECT * FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const params: any[] = [limit, offset];

    if (role) {
      usersQuery += ' WHERE role = $3';
      countQuery += ' WHERE role = $1';
    }

    usersQuery += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';

    const [usersResult, countResult] = await Promise.all([
      pool.query<User>(usersQuery, role ? [limit, offset, role] : params),
      pool.query<{ count: string }>(countQuery, role ? [role] : [])
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0]!.count, 10)
    };
  }

  async checkHasBorrowings(id: number): Promise<boolean> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM borrowing_transactions WHERE borrower_id = $1',
      [id]
    );
    return parseInt(result.rows[0]!.count, 10) > 0;
  }
}
