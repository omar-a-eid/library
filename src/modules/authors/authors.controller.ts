import type { Request, Response, NextFunction } from 'express';
import { AuthorsService } from './authors.service';

export class AuthorsController {
  private service: AuthorsService;

  constructor() {
    this.service = new AuthorsService();
  }

  createAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const author = await this.service.createAuthor(req.body);
      res.status(201).json({
        status: 'success',
        data: author
      });
    } catch (error) {
      next(error);
    }
  };

  getAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const author = await this.service.getAuthorById(Number(req.params.id));
      res.json({
        status: 'success',
        data: author
      });
    } catch (error) {
      next(error);
    }
  };

  updateAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const author = await this.service.updateAuthor(Number(req.params.id), req.body);
      res.json({
        status: 'success',
        data: author
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAuthor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteAuthor(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  listAuthors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await this.service.listAuthors(page, limit);
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };
}
