import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().cuid("Invalid parent category ID").optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
