import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Prisma errors
  if (err.code === 'P2002') {
    const statusCode = 409;
    const message = `Unique constraint failed on field: ${err.meta?.target}`;
    err = new AppError(statusCode, message);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    const statusCode = 404;
    const message = 'Record not found';
    err = new AppError(statusCode, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const statusCode = 401;
    const message = 'Invalid token';
    err = new AppError(statusCode, message);
  }

  if (err.name === 'TokenExpiredError') {
    const statusCode = 401;
    const message = 'Token expired';
    err = new AppError(statusCode, message);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const statusCode = 400;
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    err = new AppError(statusCode, message);
  }

  res.status(err.statusCode).json({
    success: false,
    error: {
      statusCode: err.statusCode,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    requestId: res.locals.requestId
  });
};