import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../../lib/db';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized: No token provided',
        code: 'MISSING_AUTH_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { userId: string };

    // Verify user exists and is active
    const user = await pool.query(
      'SELECT id, wallet_address, is_admin FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (!user.rows.length) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized: Invalid or expired token',
        code: 'INVALID_AUTH_TOKEN'
      });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden: Admin access required',
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }
  next();
};
