import express from 'express';
import session from 'express-session';
import { appConfig as _appConfig } from './index';
import MemoryStoreFactory from 'memorystore';

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
  const MemoryStore = MemoryStoreFactory(session);
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
// This applies express-session which is REQUIRED for CSRF protection to work
const sessionMiddleware = (session as any)(sessionConfig);

export { sessionMiddleware };
