import { ShelfLocationsRepository } from './shelf-locations.repository';
import type { ShelfLocationInput } from './shelf-locations.schema';
import type { ShelfLocation } from './shelf-locations.types';

export class ShelfLocationsService {
  private repository: ShelfLocationsRepository;

  constructor() {
    this.repository = new ShelfLocationsRepository();
  }

  async getShelfLocationById(id: number): Promise<ShelfLocation | null> {
    return this.repository.findById(id);
  }

  async findOrCreateShelfLocation(data: ShelfLocationInput): Promise<ShelfLocation> {
    return this.repository.findOrCreate(data);
  }
}
