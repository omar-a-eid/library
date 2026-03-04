import { z } from 'zod';

export const checkoutBookSchema = z.object({
  body: z.object({
    book_id: z.number().int().positive(),
    borrower_id: z.number().int().positive(),
    due_days: z.number().int().positive().max(90).default(14),
  }),
});

export const returnBookSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

export const listBorrowingsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number).refine(val => val <= 100, {
      message: 'Limit must not exceed 100'
    }),
    borrower_id: z.string().optional().transform(val => val ? Number(val) : undefined),
    state: z.enum(['checked_out', 'returned', 'overdue']).optional(),
  }),
});

export const borrowingIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

export const myBooksSchema = z.object({
  params: z.object({
    borrower_id: z.string().transform(Number),
  }),
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number).refine(val => val <= 100, {
      message: 'Limit must not exceed 100'
    }),
  }),
});

export type CheckoutBookInput = z.infer<typeof checkoutBookSchema>['body'];
