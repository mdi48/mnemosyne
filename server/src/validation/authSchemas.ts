import { z } from 'zod';

// Schema for user registration
export const registerSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email address.')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100, 'Password must be less than 100 characters.'),
  name: z.string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be less than 100 characters.'),
  likesPrivate: z.boolean()
    .optional()
    .default(false)
});

// Schema for user login
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email address.')),
  password: z.string()
    .min(1, 'Password is required.')
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
