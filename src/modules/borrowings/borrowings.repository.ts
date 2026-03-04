import type { PoolClient } from 'pg';
import { pool } from '../../config/db';
import type { CheckoutBookInput } from './borrowings.schema';
import type { BorrowingTransaction, BorrowingWithDetails, BorrowState } from './borrowings.types';

export class BorrowingsRepository {
  async decreaseBookQuantity(client: PoolClient, bookId: number): Promise<void> {
    await client.query(
      'UPDATE books SET available_qty = available_qty - 1 WHERE id = $1',
      [bookId]
    );
  }

  async increaseBookQuantity(client: PoolClient, bookId: number): Promise<void> {
    await client.query(
      'UPDATE books SET available_qty = available_qty + 1 WHERE id = $1',
      [bookId]
    );
  }

  async checkoutBookWithTransaction(data: CheckoutBookInput, dueDate: Date): Promise<BorrowingTransaction> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query<BorrowingTransaction>(
        `INSERT INTO borrowing_transactions (borrower_id, book_id, due_date)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.borrower_id, data.book_id, dueDate]
      );
      const borrowing = result.rows[0]!;

      await this.decreaseBookQuantity(client, data.book_id);

      await client.query('COMMIT');
      return borrowing;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async returnBookWithTransaction(id: number, returnDate: Date, bookId: number): Promise<BorrowingTransaction | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query<BorrowingTransaction>(
        `UPDATE borrowing_transactions 
         SET return_date = $1, state = 'returned'
         WHERE id = $2 AND state != 'returned'
         RETURNING *`,
        [returnDate, id]
      );

      if (result.rows[0]) {
        await this.increaseBookQuantity(client, bookId);
        await client.query('COMMIT');
        return result.rows[0];
      }

      await client.query('ROLLBACK');
      return null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async create(data: CheckoutBookInput, dueDate: Date): Promise<BorrowingTransaction> {
    const result = await pool.query<BorrowingTransaction>(
      `INSERT INTO borrowing_transactions (borrower_id, book_id, due_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.borrower_id, data.book_id, dueDate]
    );
    return result.rows[0]!;
  }

  async findById(id: number): Promise<BorrowingWithDetails | null> {
    const result = await pool.query<BorrowingWithDetails>(
      `SELECT 
         bt.*,
         u.name as borrower_name,
         u.email as borrower_email,
         b.title as book_title,
         b.isbn as book_isbn
       FROM borrowing_transactions bt
       JOIN users u ON bt.borrower_id = u.id
       JOIN books b ON bt.book_id = b.id
       WHERE bt.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async returnBook(id: number, returnDate: Date): Promise<BorrowingTransaction | null> {
    const result = await pool.query<BorrowingTransaction>(
      `UPDATE borrowing_transactions 
       SET return_date = $1, state = 'returned'
       WHERE id = $2 AND state != 'returned'
       RETURNING *`,
      [returnDate, id]
    );
    return result.rows[0] || null;
  }

  async list(
    page: number,
    limit: number,
    borrowerId?: number,
    state?: BorrowState
  ): Promise<{ borrowings: BorrowingWithDetails[]; total: number }> {
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const filterParams: any[] = [];
    let paramCount = 1;

    if (borrowerId !== undefined) {
      conditions.push(`bt.borrower_id = $${paramCount++}`);
      filterParams.push(borrowerId);
    }

    if (state !== undefined) {
      conditions.push(`bt.state = $${paramCount++}`);
      filterParams.push(state);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [borrowingsResult, countResult] = await Promise.all([
      pool.query<BorrowingWithDetails>(
        `SELECT 
           bt.*,
           u.name as borrower_name,
           u.email as borrower_email,
           b.title as book_title,
           b.isbn as book_isbn
         FROM borrowing_transactions bt
         JOIN users u ON bt.borrower_id = u.id
         JOIN books b ON bt.book_id = b.id
         ${whereClause}
         ORDER BY bt.checkout_date DESC
         LIMIT $${paramCount++} OFFSET $${paramCount++}`,
        [...filterParams, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM borrowing_transactions bt ${whereClause}`,
        filterParams
      )
    ]);

    return {
      borrowings: borrowingsResult.rows,
      total: parseInt(countResult.rows[0]!.count, 10)
    };
  }

  async getActiveBorrowingByBookId(bookId: number): Promise<BorrowingTransaction | null> {
    const result = await pool.query<BorrowingTransaction>(
      `SELECT * FROM borrowing_transactions 
       WHERE book_id = $1 AND state != 'returned'
       ORDER BY checkout_date DESC
       LIMIT 1`,
      [bookId]
    );
    return result.rows[0] || null;
  }

  async updateOverdueBooks(): Promise<number> {
    const result = await pool.query(
      `UPDATE borrowing_transactions 
       SET state = 'overdue'
       WHERE state = 'checked_out' 
       AND due_date < CURRENT_DATE
       AND return_date IS NULL`
    );
    return result.rowCount || 0;
  }

  async getMyCurrentBooks(borrowerId: number, page: number, limit: number): Promise<{ borrowings: BorrowingWithDetails[]; total: number }> {
    const offset = (page - 1) * limit;

    const [borrowingsResult, countResult] = await Promise.all([
      pool.query<BorrowingWithDetails>(
        `SELECT 
           bt.*,
           u.name as borrower_name,
           u.email as borrower_email,
           b.title as book_title,
           b.isbn as book_isbn
         FROM borrowing_transactions bt
         JOIN users u ON bt.borrower_id = u.id
         JOIN books b ON bt.book_id = b.id
         WHERE bt.borrower_id = $1 AND bt.state != 'returned'
         ORDER BY bt.due_date ASC
         LIMIT $2 OFFSET $3`,
        [borrowerId, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM borrowing_transactions 
         WHERE borrower_id = $1 AND state != 'returned'`,
        [borrowerId]
      )
    ]);

    return {
      borrowings: borrowingsResult.rows,
      total: parseInt(countResult.rows[0]!.count, 10)
    };
  }


  async getBorrowingsByPeriod(startDate: Date, endDate: Date): Promise<BorrowingWithDetails[]> {
    const result = await pool.query<BorrowingWithDetails>(
      `SELECT 
         bt.*,
         u.name as borrower_name,
         u.email as borrower_email,
         b.title as book_title,
         b.isbn as book_isbn
       FROM borrowing_transactions bt
       JOIN users u ON bt.borrower_id = u.id
       JOIN books b ON bt.book_id = b.id
       WHERE bt.checkout_date >= $1 AND bt.checkout_date <= $2
       ORDER BY bt.checkout_date DESC`,
      [startDate, endDate]
    );

    return result.rows;
  }

  async getOverdueBorrowingsByPeriod(startDate: Date, endDate: Date): Promise<BorrowingWithDetails[]> {
    const result = await pool.query<BorrowingWithDetails>(
      `SELECT 
         bt.*,
         u.name as borrower_name,
         u.email as borrower_email,
         b.title as book_title,
         b.isbn as book_isbn,
         CURRENT_DATE - bt.due_date AS days_overdue
       FROM borrowing_transactions bt
       JOIN users u ON bt.borrower_id = u.id
       JOIN books b ON bt.book_id = b.id
       WHERE bt.state = 'overdue'
       AND bt.checkout_date >= $1 AND bt.checkout_date <= $2
       ORDER BY bt.due_date ASC`,
      [startDate, endDate]
    );

    return result.rows;
  }
}
