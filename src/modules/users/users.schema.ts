import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.email().max(255),
  password: z.string().min(6).max(255),
  role: z.enum(['admin', 'borrower']).optional().default('borrower'),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.email().max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  role: z.enum(['admin', 'borrower']).optional(),
});

export const createUserSchema = z.object({
  body: userSchema,
});

export const updateUserSchemaValidation = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
  body: updateUserSchema,
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number).refine(val => val <= 100, {
      message: 'Limit must not exceed 100'
    }),
    role: z.enum(['admin', 'borrower']).optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().transform(Number),
  }),
});

export type createUserInput = z.infer<typeof createUserSchema>['body'];
export type updateUserInput = z.infer<typeof updateUserSchemaValidation>['body'];
