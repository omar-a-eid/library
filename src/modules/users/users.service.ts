import bcrypt from 'bcryptjs';
import { AppError } from '../../middleware/errorHandler';
import { UsersRepository } from './users.repository';
import type { createUserInput, updateUserInput } from './users.schema';
import type { PaginatedUsers, UserResponse, UserRole } from './users.types';

export class UsersService {
  private repository: UsersRepository;

  constructor() {
    this.repository = new UsersRepository();
  }

  private excludePassword(user: any): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(data: createUserInput): Promise<UserResponse> {
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) throw new AppError(400, 'Email already exists');

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    const user = await this.repository.create({ ...data, password: hashedPassword });
    return this.excludePassword(user);
  }

  async getUserById(id: number): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) throw new AppError(404, 'User not found');

    return this.excludePassword(user);
  }

  async updateUser(id: number, data: updateUserInput): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (data.email) {
      const existingUser = await this.repository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new AppError(400, 'Email already exists');
      }
    }

    const updateData = { ...data };
    if (data.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }

    const updatedUser = await this.repository.update(id, updateData);

    return this.excludePassword(updatedUser);
  }

  async deleteUser(id: number): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) throw new AppError(404, 'User not found');

    const hasBorrowings = await this.repository.checkHasBorrowings(id);
    if (hasBorrowings) throw new AppError(400, 'Cannot delete user with borrowing history');

    await this.repository.delete(id);
    return this.excludePassword(user);
  }

  async listUsers(page: number, limit: number, role?: UserRole): Promise<PaginatedUsers> {
    const { users, total } = await this.repository.list(page, limit, role);

    return {
      data: users.map(user => this.excludePassword(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
