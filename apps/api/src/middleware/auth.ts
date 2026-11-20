import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

export const JWT_SECRET = process.env.JWT_SECRET || 'appointo-dev-jwt-secret';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
      req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    } catch {
      // Invalid token — leave unauthenticated
    }
  }
  next();
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
