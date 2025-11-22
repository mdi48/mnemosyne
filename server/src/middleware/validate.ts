import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateBody = (schema: z.ZodType<any, any, any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and parse the request body
      const validated = schema.parse(req.body);
      
      // Replace request body with validated/parsed data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const errors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
        return;
      }
      
      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: 'Internal server error during validation'
      });
    }
  };
};
