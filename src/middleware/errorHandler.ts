import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Handle PostgreSQL foreign key constraint violations
  if ((err as any).code === '23503') {
    res.status(400).json({
      status: 'error',
      message: 'Cannot delete this record because it is referenced by other records.',
    });
    return;
  }

  console.error('ERROR:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};