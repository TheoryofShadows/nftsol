// Extend the Express Session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    // Add other session properties here if needed
  }
}

// This makes TypeScript aware of the session property on the Request object
declare global {
  namespace Express {
    interface Request {
      session: any; // You can replace 'any' with a more specific type if needed
    }
  }
}
