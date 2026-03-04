import { z } from 'zod';
import { shelfLocationSchema } from '../shelf-locations/shelf-locations.schema';

export const createBookSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    author_ids: z.array(z.number().int().positive()).min(1).max(10),
    isbn: z.string().min(10).max(20),
    available_qty: z.number().int().nonnegative().default(1),
    shelf_location: shelfLocationSchema,
  }),
});

export const updateBookSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    author_ids: z.array(z.number().int().positive()).min(1).max(10).optional(),
    isbn: z.string().min(10).max(20).optional(),
    available_qty: z.number().int().nonnegative().optional(),
    shelf_location: shelfLocationSchema.optional(),
  }),
});

export const listBooksSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number).refine(val => val <= 100, {
      message: 'Limit must not exceed 100'
    }),
  }),
});

export const searchBooksSchema = z.object({
  query: z.object({
    title: z.string().max(200).optional(),
    author: z.string().max(200).optional(),
    isbn: z.string().max(20).optional(),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number).refine(val => val <= 100, {
      message: 'Limit must not exceed 100'
    }),
  }),
});

export const bookIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

export type CreateBookInput = z.infer<typeof createBookSchema>['body'];
export type UpdateBookInput = z.infer<typeof updateBookSchema>['body'];
