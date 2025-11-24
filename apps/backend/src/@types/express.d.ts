import 'express-session';

declare module 'express-serve-static-core' {
  interface Request {
    // Multer
    file?: Express.Multer.File;
    files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];

    // CSRF
    csrfToken?: () => string;

    // Sessions
    sessionID?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: any;

    // Custom wallet field used in validation
    walletAddress?: string;
  }
}
