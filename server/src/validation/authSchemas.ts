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
  username: z.string()
    .trim()
    .min(1, 'Username is required.')
    .max(30, 'Username must be 30 characters or less.'),
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

// Schema for updating user profile
export const updateProfileSchema = z.object({
  username: z.string()
    .trim()
    .min(1, 'Username is required.')
    .max(30, 'Username must be 30 characters or less.')
    .optional(),
  displayName: z.string()
    .max(100, 'Display name must be less than 100 characters.')
    .transform(val => val && val.trim() ? val.trim() : null) // Trim and convert empty to null
    .nullable()
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters.')
    .transform(val => val && val.trim() ? val.trim() : null) // Trim and convert empty to null
    .nullable()
    .optional(),
  avatarUrl: z.string()
    .max(500, 'URL must be less than 500 characters.')
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Allow null/empty/whitespace
      try {
        new URL(val.trim());
        return true;
      } catch {
        return false;
      }
    }, { message: 'Invalid URL format.' })
    .transform(val => val && val.trim() ? val.trim() : null) // Trim and convert empty to null
    .nullable()
    .optional(),
  email: z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email address.'))
    .optional(),
  likesPrivate: z.boolean()
    .optional()
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
