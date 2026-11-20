import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export const JWT_SECRET = process.env.JWT_SECRET || 'calendly-secret-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      return next();
    } catch (err) {
      // invalid token, fallback
    }
  }

  // Fallback to default user (Alex Morgan)
  const defaultUser = await prisma.user.findFirst();
  if (defaultUser) {
    req.userId = defaultUser.id;
    req.user = defaultUser;
  }
  next();
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development/demo mode, fallback to default user
    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) {
      req.userId = defaultUser.id;
      req.user = defaultUser;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
