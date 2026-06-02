import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: any;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'No token provided');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret'
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        permissions: true
      }
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    next();
  } catch (error: any) {
    throw new AppError(401, error.message || 'Authentication failed');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  };
};

export const checkPermission = (permission: keyof any) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const perms = req.user.permissions;
    if (!perms || !perms[permission]) {
      throw new AppError(403, `Permission denied: ${String(permission)}`);
    }

    next();
  };
};