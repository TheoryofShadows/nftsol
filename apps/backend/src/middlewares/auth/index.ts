import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../../lib/db';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { userId?: string; id?: string; wallet?: string; isAdmin?: boolean };

    const userId = decoded.userId || decoded.id;

    // Try to verify user exists in DB; fall back to JWT claims if DB is unavailable
    try {
      const user = await pool.query(
        'SELECT id, wallet_address, is_admin FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (!user.rows.length) {
        // If we have a userId from JWT but DB says user doesn't exist, reject
        if (userId) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid or expired token',
            code: 'INVALID_AUTH_TOKEN'
          });
        }
      } else {
        req.user = user.rows[0];
        return next();
      }
    } catch {
      // DB unavailable — fall back to JWT claims for resilience
    }

    // Fallback: use JWT claims directly (e.g., DB unavailable or no userId claim)
    req.user = { id: userId, wallet_address: decoded.wallet, is_admin: decoded.isAdmin ?? false };
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
