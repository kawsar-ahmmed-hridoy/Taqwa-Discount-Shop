import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): any => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  const statusCode = HTTP_STATUS.INTERNAL_ERROR;
  const message = process.env.NODE_ENV === 'production'
    ? MESSAGES.INTERNAL_ERROR
    : err.message || MESSAGES.INTERNAL_ERROR;

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): any => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    statusCode: HTTP_STATUS.NOT_FOUND,
  });
};
