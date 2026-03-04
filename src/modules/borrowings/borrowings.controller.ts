import type { NextFunction, Request, Response } from 'express';
import { BorrowingsService } from './borrowings.service';

export class BorrowingsController {
  private service: BorrowingsService;

  constructor() {
    this.service = new BorrowingsService();
  }

  checkoutBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const borrowing = await this.service.checkoutBook(req.body);
      res.status(201).json({
        status: 'success',
        data: borrowing
      });
    } catch (error) {
      next(error);
    }
  };

  returnBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const borrowing = await this.service.returnBook(Number(req.params.id));
      res.json({
        status: 'success',
        data: borrowing
      });
    } catch (error) {
      next(error);
    }
  };

  getBorrowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const borrowing = await this.service.getBorrowingById(Number(req.params.id));
      res.json({
        status: 'success',
        data: borrowing
      });
    } catch (error) {
      next(error);
    }
  };

  listBorrowings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const borrowerId = req.query.borrower_id ? Number(req.query.borrower_id) : undefined;
      const state = req.query.state as any;

      const result = await this.service.listBorrowings(page, limit, borrowerId, state);
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  getMyCurrentBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const borrowerId = Number(req.params.borrower_id);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this.service.getMyCurrentBooks(borrowerId, page, limit);
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  getOverdueBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await this.service.getOverdueBooks(page, limit);
      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

}
