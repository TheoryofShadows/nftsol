import { Router } from 'express';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Express } from 'express-serve-static-core';

const router = Router();

// Generate a CSRF token
function generateCSRFToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Endpoint to get a CSRF token
router.get('/csrf-token', (req: Request, res: Response) => {
  try {
    // Generate a new CSRF token
    const csrfToken = generateCSRFToken();
    
    // Log session before setting the token (for debugging)
    console.log('Session before setting CSRF token:', req.session);
    
    // Store the token in the session
    req.session.csrfToken = csrfToken;
    
    // Force save the session
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save session',
          code: 'SESSION_SAVE_ERROR'
        });
      }
      
      // Set the token in a cookie for the frontend
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false, // Allow JavaScript to read this cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
      
      // Set session cookie manually to ensure it's sent
      if (req.sessionID) {
        res.cookie('nftsol.sid', req.sessionID, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        });
      }
      
      // Log session after setting the token (for debugging)
      console.log('Session after setting CSRF token:', req.session);
      
      // Send the token in the response
      res.json({ 
        success: true,
        csrfToken,
        sessionId: req.sessionID 
      });
    });
  } catch (error) {
    console.error('Error in CSRF token endpoint:', error);
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
    console.log('CSRF check skipped for method:', req.method);
    return next();
  }
  
  console.log('=== CSRF Validation Debug ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Headers:', req.headers);
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  
  // Get the token from the request header or body
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  console.log('Token from request:', token);
  console.log('Expected token from session:', req.session.csrfToken);
  
  // Verify the token exists
  if (!token) {
    console.log('CSRF token is missing');
    return res.status(403).json({ 
      success: false, 
      error: 'CSRF token is required',
      code: 'CSRF_TOKEN_MISSING',
      receivedToken: token,
      expectedToken: req.session.csrfToken,
      sessionId: req.sessionID
    });
  }
  
  // Verify the token matches the one in the session
  if (token !== req.session.csrfToken) {
    console.log('CSRF token does not match');
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN',
      receivedToken: token,
      expectedToken: req.session.csrfToken,
      sessionId: req.sessionID
    });
  }
  
  console.log('CSRF token is valid');
  // Token is valid, continue to the next middleware
  next();
};

// Add a debug endpoint to check session and CSRF token
router.get('/debug', (req: Request, res: Response) => {
  res.json({
    success: true,
    sessionId: req.sessionID,
    csrfToken: req.session.csrfToken,
    headers: req.headers,
    cookies: req.cookies,
    session: req.session
  });
});

// Test endpoint for debugging session and cookies
export function setupTestEndpoints(app: Express) {
  app.get('/api/test/session', (req: Request, res: Response) => {
    // Log all request headers
    console.log('=== Request Headers ===');
    console.log(req.headers);
    
    // Log session
    console.log('=== Session ===');
    console.log(req.session);
    
    // Set a test cookie
    res.cookie('test_cookie', 'test_value', {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax'
    });
    
    // Set a test session variable
    req.session.testValue = 'test_session_value';
    
    res.json({
      success: true,
      message: 'Test endpoint',
      sessionId: req.sessionID,
      session: req.session,
      cookies: req.cookies,
      headers: req.headers,
    });
  });
}

export default router;
