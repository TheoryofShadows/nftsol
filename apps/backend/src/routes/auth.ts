import { Router } from 'express';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Express } from 'express-serve-static-core';
import { authLimiter } from '../middleware/rate-limiting';

const router = Router();

// Generate a CSRF token
function generateCSRFToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Endpoint to get a CSRF token (rate limited to prevent token enumeration)
router.get('/csrf-token', authLimiter, (req: Request, res: Response) => {
  try {
    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to save session',
          code: 'SESSION_SAVE_ERROR'
        });
      }

      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });

      if (req.sessionID) {
        res.cookie('nftsol.sid', req.sessionID, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        });
      }

      res.json({
        success: true,
        csrfToken
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Middleware to validate CSRF token
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, and OPTIONS methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token is required',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  if (token !== req.session.csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN'
    });
  }

  next();
};

export default router;
