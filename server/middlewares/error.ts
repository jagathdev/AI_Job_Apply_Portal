import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('CENTRAL ROUTE ERROR EXCEPTION:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';
  res.status(status).json({ error: message });
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
