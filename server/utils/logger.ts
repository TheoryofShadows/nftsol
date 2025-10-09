import * as Sentry from "@sentry/node";

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private isSentryEnabled = !!process.env.SENTRY_DSN;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
    if (this.isSentryEnabled) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context
      });
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    console.error(this.formatMessage(LogLevel.ERROR, errorMessage, context));
    
    if (this.isSentryEnabled) {
      if (error) {
        Sentry.captureException(error, {
          extra: { message, ...context }
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context
        });
      }
    }
  }

  // API request logging
  logRequest(method: string, path: string, duration: number, statusCode: number, context?: LogContext): void {
    const message = `${method} ${path} ${statusCode} in ${duration}ms`;
    
    if (statusCode >= 500) {
      this.error(message, undefined, context);
    } else if (statusCode >= 400) {
      this.warn(message, context);
    } else if (this.isDevelopment && path.startsWith('/api')) {
      this.debug(message, context);
    }
  }

  // Security event logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    const message = `[SECURITY] ${event}`;
    
    if (severity === 'high') {
      this.error(message, undefined, { severity, ...context });
    } else if (severity === 'medium') {
      this.warn(message, { severity, ...context });
    } else {
      this.info(message, { severity, ...context });
    }
  }
}

export const logger = new Logger();
