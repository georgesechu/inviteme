/**
 * Authentication middleware
 */
import { Request, Response, NextFunction } from 'express';
import { verifyTokenAsync } from '../services/auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phoneNumber: string;
  };
}

/**
 * Middleware to verify authentication token
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const user = await verifyTokenAsync(token);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  req.user = {
    id: user.id,
    phoneNumber: user.phoneNumber,
  };

  return next();
}

