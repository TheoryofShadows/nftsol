import { SessionData } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        username: string;
      };
      session: SessionData & {
        csrfToken?: string;
      };
    }
  }
}

export {};
