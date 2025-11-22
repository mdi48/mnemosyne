import { z } from 'zod';

// Schema for creating a new quote
export const createQuoteSchema = z.object({
  text: z.string()
    .trim()
    .min(1, 'Quote text is required')
    .max(2000, 'Quote text must be 2000 characters or less'),
  author: z.string()
    .trim()
    .min(1, 'Author is required')
    .max(200, 'Author name must be 200 characters or less'),
  category: z.string()
    .trim()
    .max(100, 'Category must be 100 characters or less')
    .optional(),
  tags: z.array(z.string().trim().min(1))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  source: z.string()
    .trim()
    .max(500, 'Source must be 500 characters or less')
    .optional(),
  isPublic: z.boolean()
    .optional()
    .default(true)
});

// Schema for updating a quote (all fields optional except at least one must be present)
export const updateQuoteSchema = z.object({
  text: z.string()
    .trim()
    .min(1, 'Quote text cannot be empty')
    .max(2000, 'Quote text must be 2000 characters or less')
    .optional(),
  author: z.string()
    .trim()
    .min(1, 'Author cannot be empty')
    .max(200, 'Author name must be 200 characters or less')
    .optional(),
  category: z.string()
    .trim()
    .max(100, 'Category must be 100 characters or less')
    .optional(),
  tags: z.array(z.string().trim().min(1))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  source: z.string()
    .trim()
    .max(500, 'Source must be 500 characters or less')
    .optional(),
  isPublic: z.boolean()
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Type exports
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
