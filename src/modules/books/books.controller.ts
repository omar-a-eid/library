import type { NextFunction, Request, Response } from 'express';
import { BooksService } from './books.service';

export class BooksController {
  private service: BooksService;

  constructor() {
    this.service = new BooksService();
  }

  createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const book = await this.service.createBook(req.body);
      res.status(201).json({
        status: 'success',
        data: book
      });
    } catch (error) {
      next(error);
    }
  };

  getBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const book = await this.service.getBookById(Number(req.params.id));
      res.json({
        status: 'success',
        data: book
      });
    } catch (error) {
      next(error);
    }
  };

  updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const book = await this.service.updateBook(Number(req.params.id), req.body);
      res.json({
        status: 'success',
        data: book
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const book = await this.service.deleteBook(Number(req.params.id));
      res.json({
        status: 'success',
        data: book
      });
    } catch (error) {
      next(error);
    }
  };

  listBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await this.service.listBooks(page, limit);
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  searchBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, author, isbn, page, limit } = req.query;
      const result = await this.service.searchBooks(
        {
          title: title as string | undefined,
          author: author as string | undefined,
          isbn: isbn as string | undefined,
        },
        Number(page) || 1,
        Number(limit) || 10
      );
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };
}
