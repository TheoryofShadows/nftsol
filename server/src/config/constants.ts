// Configuration constants for the application

export const RATE_LIMITS = {
  GENERAL: { window: 15 * 60 * 1000, max: 100 },
  API: { window: 60 * 1000, max: 30 },
  AUTH: { window: 15 * 60 * 1000, max: 5 },
  UPLOAD: { window: 60 * 1000, max: 10 }
} as const;

export const REQUEST_LIMITS = {
  JSON_BODY: 10 * 1024 * 1024, // 10MB
  URL_ENCODED: 10 * 1024 * 1024, // 10MB
  MAX_REQUEST_SIZE: 50 * 1024 * 1024 // 50MB
} as const;

export const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  COOKIE_NAME: 'session'
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

export const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;
