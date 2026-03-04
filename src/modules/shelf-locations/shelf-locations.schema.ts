import { z } from 'zod';

export const shelfLocationSchema = z.object({
  branch_name: z.string().min(1).max(100),
  floor_number: z.number().int().nonnegative(),
  section_name: z.string().min(1).max(100),
  shelf_code: z.string().min(1).max(50),
});

export type ShelfLocationInput = z.infer<typeof shelfLocationSchema>;
