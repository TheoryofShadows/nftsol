/**
 * 🔐 Authentication Middleware
 * Handles user authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    username: string;
    role?: string;
  };
}

/**
 * Authenticate user via JWT token
 */
export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.' 
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.id,
      walletAddress: decoded.wallet || decoded.walletAddress,
      username: decoded.username || decoded.wallet,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token.' 
    });
  }
};

/**
 * Require specific role
 */
export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions.' 
      });
    }
    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      req.user = {
        id: decoded.id,
        walletAddress: decoded.wallet || decoded.walletAddress,
        username: decoded.username || decoded.wallet,
        role: decoded.role
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
