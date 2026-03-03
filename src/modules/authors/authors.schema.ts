import { z } from 'zod';

const authorSchema = z.object({
  name: z.string().min(1).max(255),
});

export const createAuthorSchema = z.object({
  body: authorSchema,
});

export const updateAuthorSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: authorSchema,
});

export const listAuthorsSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number).refine(val => val <= 100, {
      message: 'Limit must not exceed 100'
    }),
  }),
});

export const authorIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

export type createAuthorInput = z.infer<typeof createAuthorSchema>['body'];
export type updateAuthorInput = z.infer<typeof updateAuthorSchema>['body'];