import express from 'express';
import session from 'express-session';
import { appConfig } from './index';

// Extend the Express Session type
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    // Add other session properties here as needed
  }
}

// For development, we'll use memorystore for session storage
const isProduction = process.env.NODE_ENV === 'production';

// Configure session store
let store: any = undefined;

if (!isProduction) {
  // Use memorystore for development
  const MemoryStore = require('memorystore')(session);
  store = new MemoryStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
  });
}

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'debug-secret-key',
  name: 'connect.sid', // Using default name that works
  resave: false,
  saveUninitialized: true,
  store: store,
  cookie: {
    httpOnly: true,
    secure: false, // Set to false for HTTP in development
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  }
};

// Create the session middleware
const sessionMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip session for health checks
  if (req.path === '/healthz' || req.path === '/api/health') {
    return next();
  }
  return (session as any)(sessionConfig)(req, res, next);
};

export { sessionMiddleware };
