import 'express-session';

declare module 'express-session' {
  interface SessionData {
    csrfToken: string;
    // Add other session properties here as needed
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    session: Express.Session & {
      csrfToken: string;
    };
  }
}
