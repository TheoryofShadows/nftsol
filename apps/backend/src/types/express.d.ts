import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    // Add other session properties here if needed
  }
}

declare global {
  namespace Express {
    interface Request {
      session: Session & SessionData;
    }
  }
}
