import type { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import type { UserRole } from './users.types';

export class UsersController {
  private service: UsersService;

  constructor() {
    this.service = new UsersService();
  }

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.createUser(req.body);
      res.status(201).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.getUserById(Number(req.params.id));
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.updateUser(Number(req.params.id), req.body);
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.service.deleteUser(Number(req.params.id));
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const role = req.query.role as UserRole | undefined;
      const result = await this.service.listUsers(page, limit, role);
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };
}
