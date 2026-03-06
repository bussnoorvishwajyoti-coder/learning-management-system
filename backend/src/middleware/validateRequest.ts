import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { ValidationError } from '../utils/errors';

const formatZodErrors = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.issues.forEach((err: ZodIssue) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.params = result as Record<string, string>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as Record<string, any>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};
