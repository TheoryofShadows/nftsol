// Security configuration types
export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
  };
  cors: {
    origin: string | string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  helmet: {
    contentSecurityPolicy: {
      directives: Record<string, string[]>;
    };
    frameguard: {
      action: string;
    };
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    ieNoOpen: boolean;
    noSniff: boolean;
    xssFilter: boolean;
  };
  requestSizeLimit: string;
  csrf: {
    cookie: boolean;
    ignoreMethods: string[];
  };
}

// Redis configuration
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix: string;
}

// JWT configuration
export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

// Application security configuration
export interface AppSecurityConfig {
  security: SecurityConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  rateLimit: RateLimitConfig;
}
