import { pool } from '../../config/db';
import type { ShelfLocation } from './shelf-locations.types';
import type { ShelfLocationInput } from './shelf-locations.schema';

export class ShelfLocationsRepository {
  async create(data: ShelfLocationInput): Promise<ShelfLocation> {
    const result = await pool.query<ShelfLocation>(
      `INSERT INTO shelf_locations (branch_name, floor_number, section_name, shelf_code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.branch_name, data.floor_number, data.section_name, data.shelf_code]
    );
    return result.rows[0]!;
  }

  async findById(id: number): Promise<ShelfLocation | null> {
    const result = await pool.query<ShelfLocation>(
      'SELECT * FROM shelf_locations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByDetails(
    branch: string,
    floor: number,
    section: string,
    shelf: string
  ): Promise<ShelfLocation | null> {
    const result = await pool.query<ShelfLocation>(
      `SELECT * FROM shelf_locations 
       WHERE branch_name = $1 AND floor_number = $2 AND section_name = $3 AND shelf_code = $4`,
      [branch, floor, section, shelf]
    );
    return result.rows[0] || null;
  }

  async findOrCreate(data: ShelfLocationInput): Promise<ShelfLocation> {
    const existing = await this.findByDetails(
      data.branch_name,
      data.floor_number,
      data.section_name,
      data.shelf_code
    );

    if (existing) {
      return existing;
    }

    return this.create(data);
  }
}
